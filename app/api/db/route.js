import { NextResponse } from 'next/server';
import { 
  getCollection, 
  saveDocument, 
  updateDocument, 
  deleteDocument, 
  deleteDocumentsBatch,
  getLocalDbSync,
  saveLocalDbSync
} from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    if (!collection) {
      return NextResponse.json({ error: 'Collection parameter is required' }, { status: 400 });
    }
    const data = await getCollection(collection);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, collection } = body;
    
    if (action === 'save') {
      const saved = await saveDocument(collection, body.document);
      return NextResponse.json(saved);
    }
    
    if (action === 'update') {
      const updated = await updateDocument(collection, body.id, body.updates);
      return NextResponse.json(updated);
    }
    
    if (action === 'delete') {
      const deleted = await deleteDocument(collection, body.id);
      return NextResponse.json({ success: deleted });
    }
    
    if (action === 'deleteBatch') {
      const deleted = await deleteDocumentsBatch(collection, body.ids);
      return NextResponse.json({ success: deleted });
    }

    // SPECIAL MUTATION ACTIONS (fallback mock compatibility)
    const db = getLocalDbSync();
    
    if (action === 'reorder') {
      // Reordering items of a collection (e.g. modules)
      const { items } = body; // array of { id, sequence_order }
      if (db) {
        db[collection] = db[collection].map(item => {
          const match = items.find(x => x.id === item.id);
          return match ? { ...item, sequence_order: match.sequence_order } : item;
        });
        saveLocalDbSync(db);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Only supported in mock database context' }, { status: 400 });
    }

    if (action === 'reorderLessons') {
      // Reordering lessons and potentially shifting them between modules
      const { lessons } = body; // array of { id, module_id, sequence_order }
      if (db) {
        db.lessons = db.lessons.map(item => {
          const match = lessons.find(x => x.id === item.id);
          return match ? { ...item, module_id: match.module_id, sequence_order: match.sequence_order } : item;
        });
        saveLocalDbSync(db);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Only supported in mock database context' }, { status: 400 });
    }

    if (action === 'likePost') {
      const { postId, userId } = body;
      if (db) {
        const post = db.posts.find(x => x.id === postId);
        if (post) {
          post.liked_by_users = post.liked_by_users || [];
          if (post.liked_by_users.includes(userId)) {
            post.liked_by_users = post.liked_by_users.filter(x => x !== userId);
          } else {
            post.liked_by_users.push(userId);
          }
          post.likes_count = post.liked_by_users.length;
          saveLocalDbSync(db);
          return NextResponse.json(post);
        }
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'savePost') {
      const { postId, userId } = body;
      if (db) {
        const post = db.posts.find(x => x.id === postId);
        if (post) {
          post.saved_by_users = post.saved_by_users || [];
          if (post.saved_by_users.includes(userId)) {
            post.saved_by_users = post.saved_by_users.filter(x => x !== userId);
          } else {
            post.saved_by_users.push(userId);
          }
          saveLocalDbSync(db);
          return NextResponse.json(post);
        }
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'addComment') {
      const { postId, comment } = body;
      if (db) {
        const post = db.posts.find(x => x.id === postId);
        if (post) {
          post.comments = post.comments || [];
          comment.id = 'comment-' + Date.now();
          comment.created_at = new Date().toISOString();
          comment.replies = [];
          post.comments.push(comment);
          saveLocalDbSync(db);
          return NextResponse.json(post);
        }
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'addReply') {
      const { postId, commentId, reply } = body;
      if (db) {
        const post = db.posts.find(x => x.id === postId);
        if (post) {
          const comment = post.comments.find(c => c.id === commentId);
          if (comment) {
            comment.replies = comment.replies || [];
            reply.id = 'reply-' + Date.now();
            reply.created_at = new Date().toISOString();
            comment.replies.push(reply);
            saveLocalDbSync(db);
            return NextResponse.json(post);
          }
        }
      }
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'deleteComment') {
      const { postId, commentId } = body;
      if (db) {
        const post = db.posts.find(x => x.id === postId);
        if (post) {
          post.comments = post.comments.filter(c => c.id !== commentId);
          saveLocalDbSync(db);
          return NextResponse.json(post);
        }
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'deleteReply') {
      const { postId, commentId, replyId } = body;
      if (db) {
        const post = db.posts.find(x => x.id === postId);
        if (post) {
          const comment = post.comments.find(c => c.id === commentId);
          if (comment) {
            comment.replies = comment.replies.filter(r => r.id !== replyId);
            saveLocalDbSync(db);
            return NextResponse.json(post);
          }
        }
      }
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'manageConnection') {
      const { requesterId, receiverId, status } = body;
      if (db) {
        db.connections = db.connections || [];
        if (status === 'remove') {
          // Desfazer conexão deve remover o registro da tabela member_connections
          // independentemente de quem iniciou a solicitação original
          db.connections = db.connections.filter(c => 
            !((c.requester_id === requesterId && c.receiver_id === receiverId) || 
              (c.requester_id === receiverId && c.receiver_id === requesterId))
          );
        } else {
          // Check if exists
          const existing = db.connections.find(c => 
            (c.requester_id === requesterId && c.receiver_id === receiverId) || 
            (c.requester_id === receiverId && c.receiver_id === requesterId)
          );
          if (existing) {
            existing.status = status;
            existing.updated_at = new Date().toISOString();
          } else {
            db.connections.push({
              id: 'conn-' + Date.now(),
              requester_id: requesterId,
              receiver_id: receiverId,
              status,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
        saveLocalDbSync(db);
        return NextResponse.json({ success: true, connections: db.connections });
      }
      return NextResponse.json({ error: 'Not supported' }, { status: 400 });
    }

    if (action === 'updateBannersOrder') {
      const { bannerId, direction } = body; // direction is 'up' or 'down'
      if (db) {
        db.banners = db.banners || [];
        db.banners.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
        
        const index = db.banners.findIndex(x => x.id === bannerId);
        if (index !== -1) {
          if (direction === 'up' && index > 0) {
            const temp = db.banners[index].sequence_order;
            db.banners[index].sequence_order = db.banners[index - 1].sequence_order;
            db.banners[index - 1].sequence_order = temp;
          } else if (direction === 'down' && index < db.banners.length - 1) {
            const temp = db.banners[index].sequence_order;
            db.banners[index].sequence_order = db.banners[index + 1].sequence_order;
            db.banners[index + 1].sequence_order = temp;
          }
          saveLocalDbSync(db);
          return NextResponse.json(db.banners);
        }
      }
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    if (action === 'submitMission') {
      const { submission } = body;
      if (db) {
        db.submissions = db.submissions || [];
        
        // Bloqueio de Submissão Aprovada
        const existing = db.submissions.find(s => 
          s.mission_id === submission.mission_id && s.student_id === submission.student_id
        );
        
        if (existing) {
          if (existing.status === 'approved') {
            return NextResponse.json({ error: 'Você não pode editar ou reenviar uma missão cujo status seja Aprovado.' }, { status: 400 });
          }
          // If rejected, re-submitting resets status to 'pending' and clears feedback
          existing.text_answer = submission.text_answer || '';
          existing.form_submitted_link = submission.form_submitted_link || '';
          existing.file_url = submission.file_url || '';
          existing.file_name = submission.file_name || '';
          existing.status = 'pending';
          existing.feedback = '';
          existing.submitted_at = new Date().toISOString();
          saveLocalDbSync(db);
          return NextResponse.json(existing);
        } else {
          submission.id = 'sub-' + Date.now();
          submission.status = 'pending';
          submission.feedback = '';
          submission.submitted_at = new Date().toISOString();
          db.submissions.push(submission);
          saveLocalDbSync(db);
          return NextResponse.json(submission);
        }
      }
      return NextResponse.json({ error: 'Database context not available' }, { status: 500 });
    }

    if (action === 'reviewSubmission') {
      const { submissionId, status, feedback, reviewerId } = body;
      if (db) {
        const sub = db.submissions.find(x => x.id === submissionId);
        if (sub) {
          sub.status = status;
          sub.feedback = feedback;
          sub.reviewed_at = new Date().toISOString();
          sub.reviewed_by = reviewerId;
          saveLocalDbSync(db);
          return NextResponse.json(sub);
        }
      }
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

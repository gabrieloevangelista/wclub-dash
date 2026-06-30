'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import OnboardingTour from '@/components/OnboardingTour';
import { 
  Play, Calendar, CheckCircle, ArrowRight, Award, Video, Compass, 
  Users, Heart, Bookmark, MessageSquare, Send, Trash2, Image, 
  Film, FileText, ChevronLeft, ChevronRight, X, Clock 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, showToast } = useAuth();
  
  // Dashboard Core Navigation tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'feed'

  // General Metrics States
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [events, setEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [missions, setMissions] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);

  // Community Feed States
  const [posts, setPosts] = useState([]);
  const [activeStory, setActiveStory] = useState(null); // Story selected for view
  const [activeLightbox, setActiveLightbox] = useState(null); // Post selected for lightbox view
  
  // Feed creation fields
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [newPostType, setNewPostType] = useState('standard'); // 'standard', 'status', 'reels'
  const [posting, setPosting] = useState(false);

  // Comment fields (keys are postId)
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({}); // keys are commentId
  const [activeReplyBox, setActiveReplyBox] = useState(null); // commentId

  // Refresh helper
  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [cRes, lRes, eRes, mRes, sRes, pRes] = await Promise.all([
        fetch('/api/db?collection=courses'),
        fetch('/api/db?collection=lessons'),
        fetch('/api/db?collection=events'),
        fetch('/api/db?collection=missions'),
        fetch('/api/db?collection=submissions'),
        fetch('/api/db?collection=posts')
      ]);

      if (cRes.ok && lRes.ok && eRes.ok && mRes.ok && sRes.ok && pRes.ok) {
        const coursesData = await cRes.json();
        const lessonsData = await lRes.json();
        const eventsData = await eRes.json();
        const missionsData = await mRes.json();
        const submissionsData = await sRes.json();
        const postsData = await pRes.json();

        // 1. Visibilidade Temporal checks
        const nowStr = new Date().toISOString();
        let visibleLessons = lessonsData;
        if (user.member_type !== 'admin') {
          visibleLessons = lessonsData.filter(l => 
            l.status === 'published' && (!l.scheduled_at || l.scheduled_at <= nowStr)
          );
        }

        setCourses(coursesData.filter(c => user.member_type === 'admin' || c.status === 'publicado'));
        setLessons(visibleLessons);
        setEvents(eventsData.sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
        setMissions(missionsData);
        
        const userSubs = submissionsData.filter(s => s.student_id === user.id);
        setSubmissions(userSubs);

        const watchedCount = user.username === 'ana.costa' ? 1 : 0;
        const totalCount = visibleLessons.length || 1;
        setProgressPercent(Math.min(100, Math.round((watchedCount / totalCount) * 100)));

        // 2. Feed Posts chronological sort
        postsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPosts(postsData);
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    }
  };

  // COMMUNITY POSTS DISPATCHERS (PRD 4.4)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostMedia.trim()) return;

    setPosting(true);
    try {
      const newPost = {
        user_id: user.id,
        author_name: user.name,
        author_avatar: user.img || '',
        author_role: user.role || 'Mentornado',
        content: newPostContent.trim(),
        image_url: newPostType === 'standard' || newPostType === 'status' ? newPostMedia : '',
        video_url: newPostType === 'reels' ? newPostMedia : '',
        likes_count: 0,
        liked_by_users: [],
        saved_by_users: [],
        comments: [],
        post_type: newPostType
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          collection: 'posts',
          document: newPost
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setPosts(prev => [saved, ...prev]);
        setNewPostContent('');
        setNewPostMedia('');
        showToast(newPostType === 'status' ? 'Status publicado!' : newPostType === 'reels' ? 'Reels publicado!' : 'Publicação compartilhada no feed!', 'success');
      }
    } catch (e) {
      showToast('Erro ao publicar post.', 'error');
    }
    setPosting(false);
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'likePost',
          postId,
          userId: user.id
        })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        // If active in lightbox, sync details
        if (activeLightbox && activeLightbox.id === postId) {
          setActiveLightbox(updatedPost);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'savePost',
          postId,
          userId: user.id
        })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        if (activeLightbox && activeLightbox.id === postId) {
          setActiveLightbox(updatedPost);
        }
        showToast(updatedPost.saved_by_users.includes(user.id) ? 'Publicação salva.' : 'Publicação removida dos itens salvos.', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const newComment = {
        user_id: user.id,
        author_name: user.name,
        author_avatar: user.img || '',
        author_role: user.role || 'Membro',
        content: text.trim()
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addComment',
          postId,
          comment: newComment
        })
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        if (activeLightbox && activeLightbox.id === postId) {
          setActiveLightbox(updatedPost);
        }
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        showToast('Comentário publicado!', 'success');
      }
    } catch (err) {
      showToast('Erro ao comentar.', 'error');
    }
  };

  const handleAddReply = async (postId, commentId, e) => {
    e.preventDefault();
    const text = replyInputs[commentId];
    if (!text || !text.trim()) return;

    try {
      const newReply = {
        user_id: user.id,
        author_name: user.name,
        author_avatar: user.img || '',
        content: text.trim()
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addReply',
          postId,
          commentId,
          reply: newReply
        })
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        if (activeLightbox && activeLightbox.id === postId) {
          setActiveLightbox(updatedPost);
        }
        setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
        setActiveReplyBox(null);
        showToast('Resposta publicada!', 'success');
      }
    } catch (err) {
      showToast('Erro ao responder comentário.', 'error');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('Deseja excluir este comentário?')) return;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteComment',
          postId,
          commentId
        })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        if (activeLightbox && activeLightbox.id === postId) {
          setActiveLightbox(updatedPost);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReply = async (postId, commentId, replyId) => {
    if (!confirm('Deseja excluir esta resposta?')) return;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteReply',
          postId,
          commentId,
          replyId
        })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        if (activeLightbox && activeLightbox.id === postId) {
          setActiveLightbox(updatedPost);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Deseja realmente excluir esta publicação?')) return;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          collection: 'posts',
          id: postId
        })
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        showToast('Publicação excluída.', 'success');
        if (activeLightbox) setActiveLightbox(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter Stories/Status (PRD 4.4: Active Stories that are < 24h old)
  const activeStories = posts.filter(p => {
    if (p.post_type !== 'status') return false;
    const isExpired = Date.now() - new Date(p.created_at) > 24 * 3600 * 1000;
    return !isExpired;
  });

  const reelsPosts = posts.filter(p => p.post_type === 'reels');
  const feedPosts = posts.filter(p => p.post_type === 'standard');

  const approvedMissions = submissions.filter(s => s.status === 'approved').length;
  const nextEvents = events.slice(0, 2);

  if (!user) {
    return (
      <div className="loader-box glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="premium-loader"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Onboarding Tour Wrapper */}
      <OnboardingTour />

      {/* RENDER VIEW: OVERVIEW */}
      {true && (
        <>
          <section id="tour-welcome" className="greeting-card glass-panel fade-in">
            <div className="greeting-text">
              <span className="welcome-tag">PORTAL DO MEMBRO</span>
              <h1>{new Date().getHours() >= 5 && new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() >= 12 && new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, <span className="text-gold">{(() => { const nameParts = user?.name.trim().split(/\s+/) || []; const titles = ['dr.', 'drª.', 'eng.', 'prof.', 'mentor']; let disp = nameParts[0] || ''; if (nameParts.length > 1 && titles.includes(disp.toLowerCase())) { disp += ' ' + nameParts[1]; } return disp; })()}</span>!</h1>
              <p className="greeting-bio">{user?.role} na empresa <strong>{user?.company || 'WHITECLUB'}</strong></p>
            </div>
            <div className="quick-stats-pills">
              <div className="stat-pill">
                <span className="pill-val">{user?.member_type === 'admin' ? 'Administrador' : user?.member_type === 'master' ? 'Mentor Master' : 'Mentorado'}</span>
                <span className="pill-lbl">Acesso</span>
              </div>
              <div className="stat-pill border-gold">
                <span className="pill-val text-gold">{user?.status}</span>
                <span className="pill-lbl">Status</span>
              </div>
            </div>
          </section>

          <section id="tour-progress" className="progress-section glass-panel fade-in">
            <h2>Progresso de Mentoria</h2>
            <div className="progress-grid">
              <div className="progress-card">
                <div className="progress-header">
                  <span className="progress-title">Aulas Assistidas</span>
                  <span className="progress-value">{progressPercent}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <p className="progress-desc">Conclua as Masterclasses para validar sua certificação de elite.</p>
              </div>

              <div className="progress-card">
                <div className="progress-header">
                  <span className="progress-title">Missões Práticas</span>
                  <span className="progress-value">{approvedMissions} / {missions.length}</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill gold-fill" style={{ width: `${missions.length ? (approvedMissions / missions.length) * 100 : 0}%` }}></div>
                </div>
                <p className="progress-desc">{approvedMissions} entregas aprovadas pelos mentores.</p>
              </div>
            </div>
          </section>

          <div className="dashboard-grid">
            <div className="grid-col-left">
              <section id="tour-courses" className="courses-teaser glass-panel fade-in">
                <div className="section-title-row">
                  <h2>Masterclasses em Destaque</h2>
                  <Link href="/masterclasses" className="view-all-link">Ver todas <ArrowRight size={14} /></Link>
                </div>
                <div className="courses-list-teaser">
                  {courses.slice(0, 2).map(c => (
                    <div key={c.id} className="course-row-card glass-panel-hover">
                      <div className="course-cover-mini"><img src={c.cover_image_url} alt={c.title} /></div>
                      <div className="course-info-mini">
                        <h3>{c.title}</h3>
                        <p>{c.description.substring(0, 70)}...</p>
                      </div>
                      <Link href={`/masterclasses/curso/${c.slug}`} className="btn-play-mini"><Play size={12} fill="currentColor" /></Link>
                    </div>
                  ))}
                </div>
              </section>

              <section id="tour-posts" className="community-teaser glass-panel fade-in">
                <div className="section-title-row">
                  <h2>Comunidade e Interação</h2>
                  <Link href="/feed" className="view-all-link">Interagir no Feed <ArrowRight size={14} /></Link>
                </div>
                <div className="feed-teaser-cards">
                  <div className="feed-teaser-item">
                    <div className="teaser-icon"><Users size={16} /></div>
                    <div>
                      <h4>Rede de Conexões</h4>
                      <p>Envie solicitações de networking, aceitar parceiros e explore novos mentores.</p>
                      <Link href="/conexoes" className="teaser-link">Ver Conexões</Link>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid-col-right">
              <section id="tour-events" className="events-teaser glass-panel fade-in">
                <div className="section-title-row">
                  <h2>Próximos Encontros</h2>
                  <Link href="/agenda" className="view-all-link">Ver Calendário <ArrowRight size={14} /></Link>
                </div>
                <div className="events-list-teaser">
                  {nextEvents.length === 0 ? (
                    <p className="empty-text">Nenhuma data marcada.</p>
                  ) : (
                    nextEvents.map(e => (
                      <div key={e.id} className={`event-teaser-card border-${e.event_type}`}>
                        <div className="event-date-badge">
                          <span className="day">{e.event_date.split('-')[2]}</span>
                          <span className="month">{new Date(e.event_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                        </div>
                        <div className="event-info-teaser">
                          <span className="event-type-badge-inline">{e.event_type === 'mentoria' ? 'Mentoria' : 'Atualização'}</span>
                          <h3>{e.title}</h3>
                          <span className="time">{e.start_time.substring(0, 5)} - {e.end_time.substring(0, 5)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* RENDER VIEW: COMMUNITY FEED */}
      {activeTab === 'feed' && (
        <div className="feed-layout fade-in">
          
          {/* Stories/Status horizontal bubble reels (PRD 4.4) */}
          <div className="stories-scroller glass-panel">
            <div className="stories-list">
              {/* Direct creation post quick bubble */}
              <div className="story-circle-item add-story" onClick={() => { setNewPostType('status'); setNewPostContent('Seu story rápido aqui'); setNewPostMedia('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400'); }}>
                <div className="story-bubble-avatar"><Plus size={18} /></div>
                <span>Adicionar</span>
              </div>

              {activeStories.map(st => (
                <div key={st.id} className="story-circle-item" onClick={() => setActiveStory(st)}>
                  <div className="story-bubble-avatar border-glow">
                    {st.author_avatar ? <img src={st.author_avatar} alt={st.author_name} /> : <span>{(st.author_name || 'MB').substring(0, 2).toUpperCase()}</span>}
                  </div>
                  <span>{st.author_name ? st.author_name.split(' ')[0] : 'Membro'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="feed-grid">
            {/* Feed Main Left column */}
            <div className="feed-main-col">
              
              {/* Creator Card Post */}
              <div className="creator-card glass-panel">
                <div className="creator-top">
                  <div className="avatar-bubble">
                    {user?.img ? <img src={user.img} alt={user.name} /> : <span>{user?.initials || 'CL'}</span>}
                  </div>
                  <input 
                    type="text" 
                    className="premium-input creator-input"
                    placeholder={`O que está desenvolvendo hoje, ${user?.name ? user.name.split(' ')[0] : 'Membro'}?`}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                </div>

                <div className="creator-media-row">
                  <div className="input-group">
                    <input 
                      type="url" 
                      className="premium-input media-link-input"
                      placeholder="Link da Imagem ou Vídeo (opcional)"
                      value={newPostMedia}
                      onChange={(e) => setNewPostMedia(e.target.value)}
                    />
                  </div>
                </div>

                <div className="creator-footer">
                  <div className="type-selectors">
                    <button 
                      type="button" 
                      onClick={() => setNewPostType('standard')}
                      className={`type-selector-btn ${newPostType === 'standard' ? 'active' : ''}`}
                    >
                      <Image size={14} /> Feed Post
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNewPostType('status')}
                      className={`type-selector-btn ${newPostType === 'status' ? 'active' : ''}`}
                    >
                      <Clock size={14} /> Story (24h)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNewPostType('reels')}
                      className={`type-selector-btn ${newPostType === 'reels' ? 'active' : ''}`}
                    >
                      <Film size={14} /> Reels Video
                    </button>
                  </div>

                  <button 
                    onClick={handleCreatePost} 
                    className="btn-gold post-btn"
                    disabled={posting || (!newPostContent.trim() && !newPostMedia.trim())}
                  >
                    <Send size={14} /> {posting ? 'Postando...' : 'Compartilhar'}
                  </button>
                </div>
              </div>

              {/* Feed posts list */}
              <div className="feed-posts-list">
                {feedPosts.length === 0 ? (
                  <div className="glass-panel empty-feed">Escreva sua primeira postagem no feed!</div>
                ) : (
                  feedPosts.map(post => {
                    const isLiked = user?.id ? post.liked_by_users?.includes(user.id) : false;
                    const isSaved = user?.id ? post.saved_by_users?.includes(user.id) : false;
                    const canDelete = user ? (post.user_id === user.id || user.member_type === 'admin') : false;

                    return (
                      <div key={post.id} className="feed-post-card glass-panel">
                        {/* Post Header */}
                        <div className="post-header">
                          <div className="author-row">
                            <div className="avatar-bubble">
                              {post.author_avatar ? <img src={post.author_avatar} alt={post.author_name} /> : <span>{(post.author_name || 'MB').substring(0, 2).toUpperCase()}</span>}
                            </div>
                            <div>
                              <h4>{post.author_name}</h4>
                              <p>{post.author_role} • {new Date(post.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>

                          {canDelete && (
                            <button onClick={() => handleDeletePost(post.id)} className="btn-delete-post" title="Excluir post">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Post Content */}
                        <div className="post-body">
                          <p className="post-text">{post.content}</p>
                          
                          {/* Media image display */}
                          {post.image_url && (
                            <div className="post-media-box" onClick={() => setActiveLightbox(post)}>
                              <img src={post.image_url} alt="Media" className="post-media-image" />
                            </div>
                          )}

                          {/* Media video display */}
                          {post.video_url && (
                            <div className="post-media-box">
                              <video src={post.video_url} controls className="post-media-video" />
                            </div>
                          )}
                        </div>

                        {/* Actions bar (Likes, Saves, Comments) */}
                        <div className="post-actions-bar">
                          <button onClick={() => handleLikePost(post.id)} className={`action-btn ${isLiked ? 'liked' : ''}`}>
                            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                            <span>{post.likes_count || 0} Curtidas</span>
                          </button>
                          <button onClick={() => handleSavePost(post.id)} className={`action-btn ${isSaved ? 'saved' : ''}`}>
                            <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                            <span>Salvar</span>
                          </button>
                        </div>

                        {/* Sub-Comments nesting (Replies) */}
                        <div className="comments-collapsible-section">
                          <form onSubmit={(e) => handleAddComment(post.id, e)} className="comment-input-row">
                            <input 
                              type="text" 
                              className="premium-input comment-field"
                              placeholder="Adicione um comentário..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              required
                            />
                            <button type="submit" className="btn-gold send-comment-btn"><Send size={12} /></button>
                          </form>

                          {/* Comments hierarchy list */}
                          <div className="nested-comments-list">
                            {(post.comments || []).map(comment => {
                              const canDeleteComment = user ? (comment.user_id === user.id || user.member_type === 'admin') : false;
                              const showReplyBox = activeReplyBox === comment.id;

                              return (
                                <div key={comment.id} className="comment-node">
                                  <div className="comment-main-line">
                                    <div className="comment-author-bubble">
                                      {comment.author_avatar ? <img src={comment.author_avatar} alt={comment.author_name} /> : <span>{(comment.author_name || 'MB').substring(0, 2).toUpperCase()}</span>}
                                    </div>
                                    <div className="comment-text-box">
                                      <div className="comment-header">
                                        <h5>{comment.author_name} <span className="lbl-role">{comment.author_role}</span></h5>
                                        <div className="comment-actions-controls">
                                          <button onClick={() => setActiveReplyBox(showReplyBox ? null : comment.id)} className="btn-reply-trigger">Responder</button>
                                          {canDeleteComment && (
                                            <button onClick={() => handleDeleteComment(post.id, comment.id)} className="btn-comment-delete"><Trash2 size={10} /></button>
                                          )}
                                        </div>
                                      </div>
                                      <p>{comment.content}</p>
                                    </div>
                                  </div>

                                  {/* SECOND LEVEL ANINHAMENTO (Replies, PRD 4.4) */}
                                  <div className="replies-nested-list">
                                    {(comment.replies || []).map(rep => {
                                      const canDeleteReply = user ? (rep.user_id === user.id || user.member_type === 'admin') : false;
                                      return (
                                        <div key={rep.id} className="reply-node">
                                          <div className="comment-author-bubble mini">
                                            {rep.author_avatar ? <img src={rep.author_avatar} alt={rep.author_name} /> : <span>{(rep.author_name || 'MB').substring(0, 2).toUpperCase()}</span>}
                                          </div>
                                          <div className="comment-text-box font-small">
                                            <div className="comment-header">
                                              <h5>{rep.author_name}</h5>
                                              {canDeleteReply && (
                                                <button onClick={() => handleDeleteReply(post.id, comment.id, rep.id)} className="btn-comment-delete"><Trash2 size={9} /></button>
                                              )}
                                            </div>
                                            <p>{rep.content}</p>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* Reply box creation */}
                                    {showReplyBox && (
                                      <form onSubmit={(e) => handleAddReply(post.id, comment.id, e)} className="reply-input-row fade-in">
                                        <input 
                                          type="text" 
                                          className="premium-input comment-field reply-field"
                                          placeholder={`Responder a ${comment.author_name ? comment.author_name.split(' ')[0] : 'Membro'}...`}
                                          value={replyInputs[comment.id] || ''}
                                          onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                          required
                                        />
                                        <button type="submit" className="btn-gold send-comment-btn"><Send size={10} /></button>
                                      </form>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Feed Sidebar Right column: Reels showcase */}
            <div className="feed-sidebar-col">
              <section className="glass-panel reels-box-feed">
                <h2>Reels da Comunidade ({reelsPosts.length})</h2>
                
                <div className="reels-list-layout">
                  {reelsPosts.length === 0 ? (
                    <p className="empty-text">Nenhum Reels publicado.</p>
                  ) : (
                    reelsPosts.map(reels => (
                      <div key={reels.id} className="reels-card-mini">
                        <div className="reels-player">
                          <video src={reels.video_url} controls className="reels-video" />
                        </div>
                        <div className="reels-info">
                          <span>@{reels.author_name ? reels.author_name.split(' ')[0].toLowerCase() : 'membro'}</span>
                          <p>{reels.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Stories Lightbox Overlay (PRD 4.4) */}
      {activeStory && (
        <div className="modal-backdrop story-viewer-backdrop" onClick={() => setActiveStory(null)}>
          <div className="story-viewer-card glass-panel fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="close-story-btn" onClick={() => setActiveStory(null)}><X size={18} /></button>
            <div className="story-header">
              <div className="avatar-bubble">
                {activeStory.author_avatar ? <img src={activeStory.author_avatar} alt={activeStory.author_name} /> : <span>{(activeStory.author_name || 'MB').substring(0, 2).toUpperCase()}</span>}
              </div>
              <div>
                <h4>{activeStory.author_name}</h4>
                <p>Status Story</p>
              </div>
            </div>
            <div className="story-img-body">
              <img src={activeStory.image_url} alt="Story Content" />
              <div className="story-caption-overlay">
                <p>{activeStory.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Images Media Lightbox with Comments Panel (PRD 4.4) */}
      {activeLightbox && (
        <div className="modal-backdrop lightbox-backdrop" onClick={() => setActiveLightbox(null)}>
          <div className="lightbox-container glass-panel fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="close-lightbox-btn" onClick={() => setActiveLightbox(null)}><X size={20} /></button>
            
            <div className="lightbox-left-media">
              <img src={activeLightbox.image_url} alt="Lightbox Content" />
            </div>

            <div className="lightbox-right-comments-panel">
              <div className="lightbox-author-header">
                <div className="avatar-bubble">
                  {activeLightbox.author_avatar ? <img src={activeLightbox.author_avatar} alt={activeLightbox.author_name} /> : <span>{(activeLightbox.author_name || 'MB').substring(0, 2).toUpperCase()}</span>}
                </div>
                <div>
                  <h4>{activeLightbox.author_name}</h4>
                  <p>{activeLightbox.author_role}</p>
                </div>
              </div>

              <div className="lightbox-caption">
                <p>{activeLightbox.content}</p>
              </div>

              <div className="lightbox-comments-scroller">
                {(activeLightbox.comments || []).map(comment => (
                  <div key={comment.id} className="comment-node">
                    <div className="comment-main-line">
                      <div className="comment-author-bubble mini">
                        {comment.author_avatar ? <img src={comment.author_avatar} alt={comment.author_name} /> : <span>{(comment.author_name || 'MB').substring(0, 2).toUpperCase()}</span>}
                      </div>
                      <div className="comment-text-box">
                        <h5>{comment.author_name} <span className="lbl-role">{comment.author_role}</span></h5>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lightbox-footer-form">
                <div className="post-actions-bar inline-actions">
                  <button onClick={() => handleLikePost(activeLightbox.id)} className="action-btn">
                    <Heart size={16} fill={(user?.id && activeLightbox.liked_by_users?.includes(user.id)) ? 'currentColor' : 'none'} />
                    <span>{activeLightbox.likes_count || 0}</span>
                  </button>
                </div>
                <form onSubmit={(e) => handleAddComment(activeLightbox.id, e)} className="comment-input-row">
                  <input 
                    type="text" 
                    className="premium-input comment-field"
                    placeholder="Adicione um comentário..."
                    value={commentInputs[activeLightbox.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [activeLightbox.id]: e.target.value }))}
                    required
                  />
                  <button type="submit" className="btn-gold send-comment-btn"><Send size={12} /></button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .dashboard-nav-tabs {
          padding: 8px;
          display: flex;
          gap: 8px;
          border-radius: var(--radius-md);
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-smooth);
        }
        .tab-btn.active {
          background: rgba(237, 192, 102, 0.08);
          color: var(--gold);
          font-weight: 600;
        }

        .greeting-card {
          padding: 24px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--gold-gradient);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 10px 25px -5px rgba(46, 98, 246, 0.3);
        }
        .welcome-tag {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.1em;
          margin-bottom: 6px;
          display: block;
        }
        .greeting-card h1 {
          font-size: 26px;
          margin-bottom: 4px;
          color: #FFFFFF;
        }
        .greeting-card h1 .text-gold {
          color: #FFFFFF !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .greeting-bio {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
        }
        .quick-stats-pills {
          display: flex;
          gap: 12px;
        }
        .stat-pill {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          color: #FFFFFF;
        }
        .stat-pill.border-gold {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.15);
        }
        .pill-val { font-size: 13px; font-weight: 700; color: #FFFFFF; }
        .pill-lbl { font-size: 9px; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; margin-top: 3px; }

        .progress-section {
          padding: 24px;
        }
        .progress-section h2 {
          font-size: 16px;
          margin-bottom: 16px;
        }
        .progress-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .progress-grid { grid-template-columns: 1fr 1fr; }
        }
        .progress-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 16px 20px;
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .progress-bar-container {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--gold-gradient);
          border-radius: 4px;
        }
        .progress-bar-fill.gold-fill {
          background: var(--gold-gradient);
        }
        .progress-desc {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .section-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-title-row h2 { font-size: 16px; }
        .view-all-link {
          font-size: 11px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--gold);
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .courses-teaser, .community-teaser, .events-teaser { padding: 20px; }
        .courses-list-teaser { display: flex; flex-direction: column; gap: 12px; }
        .course-row-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
        }
        .course-cover-mini { width: 50px; height: 38px; border-radius: var(--radius-sm); overflow: hidden; }
        .course-cover-mini img { width: 100%; height: 100%; object-fit: cover; }
        .course-info-mini h3 { font-size: 13px; }
        .course-info-mini p { font-size: 11px; color: var(--text-secondary); }
        .btn-play-mini {
          margin-left: auto;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(237, 192, 102, 0.1);
          color: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .feed-teaser-cards { display: flex; flex-direction: column; gap: 12px; }
        .feed-teaser-item { display: flex; gap: 12px; }
        .teaser-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gold);
        }
        .feed-teaser-item h4 { font-size: 13px; }
        .feed-teaser-item p { font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; }
        .teaser-link { font-size: 11px; color: var(--gold); font-weight: 600; }

        .events-list-teaser { display: flex; flex-direction: column; gap: 12px; }
        .event-teaser-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-left: 2px solid;
          background: rgba(255, 255, 255, 0.01);
          border-radius: var(--radius-sm);
        }
        .event-teaser-card.border-mentoria { border-left-color: var(--gold); }
        .event-teaser-card.border-atualizacao { border-left-color: #3B82F6; }
        .event-date-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
        }
        .event-date-badge .day { font-size: 14px; font-weight: 700; }
        .event-date-badge .month { font-size: 8px; color: var(--text-secondary); }
        .event-type-badge-inline { font-size: 8px; color: var(--text-muted); text-transform: uppercase; }
        .event-info-teaser h3 { font-size: 12px; }
        .event-info-teaser .time { font-size: 10px; color: var(--text-secondary); }
        .empty-text { font-size: 12px; color: var(--text-muted); text-align: center; }

        /* COMMUNITY FEED STYLING */
        .feed-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .stories-scroller {
          padding: 16px 20px;
          overflow-x: auto;
        }
        .stories-list {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .story-circle-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          min-width: 64px;
        }
        .story-bubble-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .story-bubble-avatar.border-glow {
          border: 2px solid var(--gold);
          box-shadow: 0 0 8px var(--gold-glow);
        }
        .story-bubble-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .story-circle-item span {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .story-circle-item.add-story .story-bubble-avatar {
          border: 1px dashed var(--gold-border);
          color: var(--gold);
          background: rgba(237,192,102,0.02);
        }

        .feed-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .feed-grid { grid-template-columns: 2fr 1fr; }
        }
        .feed-main-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .creator-card {
          padding: 20px;
        }
        .creator-top {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }
        .creator-top .avatar-bubble {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--gold-gradient);
          color: #010105;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .creator-top .avatar-bubble img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .creator-input {
          flex: 1;
        }
        .creator-media-row {
          margin-bottom: 12px;
        }
        .media-link-input {
          font-size: 12px;
          padding: 8px 12px;
        }
        .creator-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-light);
          padding-top: 12px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .type-selectors {
          display: flex;
          gap: 6px;
        }
        .type-selector-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 4px;
          transition: var(--transition-smooth);
        }
        .type-selector-btn:hover {
          background: rgba(255,255,255,0.02);
        }
        .type-selector-btn.active {
          border-color: var(--gold-border);
          color: var(--gold);
          background: rgba(237, 192, 102, 0.05);
        }
        .post-btn {
          height: 32px;
          padding: 0 16px;
          font-size: 12px;
          border-radius: var(--radius-sm);
        }

        .feed-posts-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .feed-post-card {
          padding: 24px;
        }
        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .author-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .author-row .avatar-bubble {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--gold-gradient);
          color: #010105;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          overflow: hidden;
        }
        .author-row .avatar-bubble img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .author-row h4 {
          font-size: 14px;
          font-weight: 600;
        }
        .author-row p {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .btn-delete-post {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
        }
        .btn-delete-post:hover {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .post-body {
          margin-bottom: 20px;
        }
        .post-text {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .post-media-box {
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-light);
          max-height: 400px;
          background: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .post-media-image {
          width: 100%;
          height: auto;
          max-height: 400px;
          object-fit: cover;
        }
        .post-media-video {
          width: 100%;
          max-height: 400px;
        }

        .post-actions-bar {
          display: flex;
          gap: 20px;
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 12px 4px;
          margin-bottom: 16px;
        }
        .action-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .action-btn:hover {
          color: var(--gold);
        }
        .action-btn.liked { color: #EF4444; }
        .action-btn.saved { color: var(--gold); }

        .comment-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .comment-field {
          flex: 1;
          height: 36px;
          font-size: 13px;
          padding: 6px 12px;
        }
        .send-comment-btn {
          width: 36px;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
        }

        .nested-comments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .comment-node {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .comment-main-line {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .comment-author-bubble {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--gold-gradient);
          color: #010105;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          overflow: hidden;
          flex-shrink: 0;
        }
        .comment-author-bubble img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .comment-text-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-light);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          flex: 1;
          font-size: 12px;
        }
        .comment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          align-items: center;
        }
        .comment-header h5 {
          font-size: 12px;
          font-weight: 600;
        }
        .lbl-role {
          font-size: 8px;
          color: var(--gold);
          background: rgba(237,192,102,0.1);
          padding: 1px 4px;
          border-radius: 2px;
          margin-left: 4px;
        }
        .comment-actions-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-reply-trigger {
          background: transparent;
          border: none;
          color: var(--gold);
          font-size: 10px;
          cursor: pointer;
        }
        .btn-comment-delete {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          padding: 2px;
        }
        .btn-comment-delete:hover {
          color: #EF4444;
        }
        .comment-text-box p {
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .replies-nested-list {
          padding-left: 38px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .reply-node {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .comment-author-bubble.mini {
          width: 22px;
          height: 22px;
          font-size: 8px;
        }
        .font-small {
          font-size: 11px;
          padding: 6px 10px;
        }
        .reply-input-row {
          display: flex;
          gap: 6px;
          margin-top: 6px;
        }
        .reply-field {
          height: 32px;
          font-size: 11px;
        }

        /* REELS SIDEBAR */
        .reels-box-feed {
          padding: 20px;
        }
        .reels-box-feed h2 {
          font-size: 16px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 10px;
        }
        .reels-list-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .reels-card-mini {
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #000;
          border: 1px solid var(--border-light);
          position: relative;
          aspect-ratio: 9/16;
        }
        .reels-player {
          width: 100%;
          height: 100%;
        }
        .reels-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .reels-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.85));
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          pointer-events: none;
        }
        .reels-info span {
          font-size: 12px;
          font-weight: 700;
          color: var(--gold);
        }
        .reels-info p {
          font-size: 11px;
          color: white;
          line-height: 1.4;
        }

        /* STORY LIGHTBOX OVERLAY */
        .story-viewer-backdrop {
          z-index: 11000;
        }
        .story-viewer-card {
          width: 100%;
          max-width: 400px;
          background: #080811;
          border-color: var(--gold-border);
          padding: 20px;
          position: relative;
        }
        .close-story-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          z-index: 20;
        }
        .story-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }
        .story-img-body {
          aspect-ratio: 9/16;
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          background: #000;
        }
        .story-img-body img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .story-caption-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          padding: 20px;
          color: white;
          text-align: center;
          font-size: 13px;
        }

        /* MEDIA LIGHTBOX PANEL */
        .lightbox-backdrop {
          z-index: 11000;
        }
        .lightbox-container {
          max-width: 900px;
          width: 100%;
          height: 550px;
          display: flex;
          overflow: hidden;
          background: #080811;
          border-color: var(--gold-border);
          position: relative;
        }
        .close-lightbox-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          z-index: 50;
        }
        .lightbox-left-media {
          flex: 1.2;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lightbox-left-media img {
          max-width: 100%;
          max-height: 550px;
          object-fit: contain;
        }
        .lightbox-right-comments-panel {
          flex: 0.8;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--border-light);
          background: rgba(10, 10, 18, 0.95);
        }
        .lightbox-author-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lightbox-author-header .avatar-bubble {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--gold-gradient);
          color: #010105;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .lightbox-author-header .avatar-bubble img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .lightbox-author-header h4 { font-size: 13px; font-weight: 600; }
        .lightbox-author-header p { font-size: 11px; color: var(--text-secondary); }
        
        .lightbox-caption {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.5;
        }
        .lightbox-comments-scroller {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .lightbox-footer-form {
          border-top: 1px solid var(--border-light);
          padding: 16px 20px;
          background: rgba(8, 8, 17, 0.5);
        }
        .lightbox-footer-form .inline-actions {
          border-top: none;
          padding-top: 0;
          margin-bottom: 12px;
          padding-bottom: 0;
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(1, 1, 5, 0.85);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .empty-feed {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
        }
        .loader-box { display: flex; align-items: center; justify-content: center; height: 150px; }
        .premium-loader { width: 30px; height: 30px; border: 2px solid rgba(237, 192, 102, 0.1); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { useRouter } from 'next/navigation';
import { 
  FileSpreadsheet, FileText, Presentation, File, Download, 
  Send, User, Calendar, Clock, AlertTriangle 
} from 'lucide-react';
import Link from 'next/link';
import JSZip from 'jszip';

export default function LessonPlayerPage({ params }) {
  const { slug } = use(params);
  const { user, showToast } = useAuth();
  const router = useRouter();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [resources, setResources] = useState([]);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const [lRes, cRes, rRes, comRes] = await Promise.all([
          fetch('/api/db?collection=lessons'),
          fetch('/api/db?collection=courses'),
          fetch('/api/db?collection=resources'),
          fetch('/api/db?collection=lesson_comments')
        ]);

        if (lRes.ok && cRes.ok && rRes.ok && comRes.ok) {
          const lessonsData = await lRes.json();
          const coursesData = await cRes.json();
          const resourcesData = await rRes.json();
          const commentsData = await comRes.json();

          const matchedLesson = lessonsData.find(l => l.slug === slug);
          if (matchedLesson) {
            const now = new Date();
            const scheduledAt = matchedLesson.scheduled_at ? new Date(matchedLesson.scheduled_at) : null;
            
            // Restrição Temporal: Não acessa aulas agendadas no futuro
            if (user?.member_type !== 'admin' && scheduledAt && scheduledAt > now) {
              showToast('Esta aula está agendada para liberação futura.', 'error');
              router.push('/sem-permissao');
              return;
            }

            setLesson(matchedLesson);

            // Fetch course
            // Need to match course from module
            const modulesRes = await fetch('/api/db?collection=modules');
            if (modulesRes.ok) {
              const modulesData = await modulesRes.json();
              const mod = modulesData.find(m => m.id === matchedLesson.module_id);
              if (mod) {
                const c = coursesData.find(x => x.id === mod.course_id);
                setCourse(c);
              }
            }

            // Filter resources
            const lessonResources = resourcesData.filter(r => r.lesson_id === matchedLesson.id);
            const nowStr = new Date().toISOString();

            if (user?.member_type === 'admin') {
              setResources(lessonResources);
            } else {
              // Hide resources with available_at > now
              const visibleResources = lessonResources.filter(r => 
                !r.available_at || r.available_at <= nowStr
              );
              setResources(visibleResources);
            }

            // Filter comments
            const lessonComments = commentsData
              .filter(c => c.lesson_id === matchedLesson.id)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setComments(lessonComments);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load lesson', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, user, router]);

  // Categorize files dynamically based on extension (PRD 4.2)
  const getResourceCategory = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { type: 'spreadsheet', icon: FileSpreadsheet, label: 'Planilha' };
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return { type: 'document', icon: FileText, label: 'Documento' };
    if (['ppt', 'pptx'].includes(ext)) return { type: 'presentation', icon: Presentation, label: 'Apresentação' };
    return { type: 'other', icon: File, label: 'Outros' };
  };

  // Download Intelligent controller (PRD 4.2)
  const handleDownload = async () => {
    if (resources.length === 0) return;
    
    if (resources.length === 1) {
      // 1 resource: direct download link
      const res = resources[0];
      showToast(`Baixando: ${res.title}`, 'info');
      const link = document.createElement("a");
      link.href = res.file_url;
      link.setAttribute("download", res.title);
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Multiple resources: compile client-side using JSZip
      setZipping(true);
      showToast('Compactando recursos em pacote ZIP...', 'info');
      try {
        const zip = new JSZip();
        const folder = zip.folder("recursos");
        
        await Promise.all(resources.map(async (res) => {
          try {
            const fileRes = await fetch(res.file_url);
            const blob = await fileRes.blob();
            folder.file(res.title, blob);
          } catch (e) {
            console.error(`Failed to download resource: ${res.title}`, e);
            // Fallback content in zip in case of CORS or download failures
            folder.file(`${res.title}-indisponivel.txt`, `Arquivo: ${res.title}\nErro ao compilar: ${e.message}\nLink de download direto: ${res.file_url}`);
          }
        }));

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `recursos-${lesson.slug}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Pacote ZIP baixado com sucesso!', 'success');
      } catch (err) {
        showToast('Erro ao compilar pacote ZIP.', 'error');
      }
      setZipping(false);
    }
  };

  // Comments submit actions
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const newComment = {
        lesson_id: lesson.id,
        user_id: user.id,
        content: newCommentText.trim(),
        // Mock UI details:
        author_name: user.name,
        author_avatar: user.img,
        author_role: user.role
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          collection: 'lesson_comments',
          document: newComment
        })
      });

      if (res.ok) {
        const savedComment = await res.json();
        // Since get db returns raw schema, attach mock UI items if they get stripped
        savedComment.author_name = user.name;
        savedComment.author_avatar = user.img;
        savedComment.author_role = user.role;

        setComments(prev => [savedComment, ...prev]);
        setNewCommentText('');
        showToast('Comentário publicado!', 'success');
      }
    } catch (e) {
      showToast('Erro ao publicar comentário.', 'error');
    }
    setSubmittingComment(false);
  };

  if (loading) {
    return (
      <div className="loader-box">
        <div className="premium-loader"></div>
        <style jsx>{`
          .loader-box { display: flex; align-items: center; justify-content: center; height: 50vh; }
          .premium-loader { width: 35px; height: 35px; border: 2px solid rgba(46, 98, 246, 0.15); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!lesson) return null;

  const isFutureScheduled = lesson.scheduled_at && new Date(lesson.scheduled_at) > new Date();

  return (
    <div className="player-wrapper">
      <div className="back-nav">
        {course && (
          <Link href={`/masterclasses/curso/${course.slug}`} className="back-link">
            ← Voltar para {course.title}
          </Link>
        )}
      </div>

      <div className="player-grid">
        {/* Left Column: Custom Video Player & Meta */}
        <div className="player-col-left">
          {/* Custom Video Player container */}
          <div className="glass-panel video-panel fade-in">
            {isFutureScheduled && (
              <div className="scheduled-overlay">
                <AlertTriangle size={36} className="text-gold" />
                <h3>Acesso Administrativo (Aula Agendada)</h3>
                <p>Esta aula está programada para ser liberada no dia {new Date(lesson.scheduled_at).toLocaleDateString('pt-BR')} às {new Date(lesson.scheduled_at).toLocaleTimeString('pt-BR')}.</p>
              </div>
            )}
            <video 
              src={lesson.video_url} 
              poster={lesson.cover_image_url || lesson.thumbnail_url} 
              controls 
              className="video-element"
            />
          </div>

          <div className="lesson-meta-card glass-panel fade-in">
            <span className="lesson-duration"><Clock size={12} /> {lesson.duration}</span>
            <h1>{lesson.title}</h1>
            <p className="lesson-desc">{lesson.description}</p>
            {lesson.long_description && (
              <div className="lesson-long-desc">
                <h3>Detalhes da Aula</h3>
                <p>{lesson.long_description}</p>
              </div>
            )}

            {/* Instructor Card */}
            <div className="instructor-card">
              <div className="instructor-avatar">
                {lesson.instructor_avatar ? (
                  <img src={lesson.instructor_avatar} alt={lesson.instructor_name} />
                ) : (
                  <span>{lesson.instructor_name?.substring(0, 2).toUpperCase() || 'WC'}</span>
                )}
              </div>
              <div className="instructor-info">
                <span className="inst-lbl">INSTRUTOR</span>
                <h3>{lesson.instructor_name || 'Dr. Carlos Lima'}</h3>
                <p>{lesson.instructor_role || 'Mentor WHITECLUB'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Resources & Comments */}
        <div className="player-col-right">
          {/* Central de Recursos */}
          <div className="glass-panel resources-box fade-in">
            <h2>Materiais de Apoio</h2>
            <p className="res-desc">Baixe as planilhas financeiras, PDFs teóricos ou pranchas de projeto desta aula.</p>

            <div className="resources-list">
              {resources.length === 0 ? (
                <div className="empty-resources">Nenhum recurso anexado a esta aula.</div>
              ) : (
                resources.map(res => {
                  const mapping = getResourceCategory(res.title);
                  const FileIcon = mapping.icon;
                  const isResScheduled = res.available_at && new Date(res.available_at) > new Date();

                  return (
                    <div key={res.id} className="resource-item">
                      <div className="res-icon-bubble">
                        <FileIcon size={18} />
                      </div>
                      <div className="res-meta-info">
                        <h4>{res.title}</h4>
                        <span className="res-cat">{mapping.label} • {res.size || 'N/A'}</span>
                        {isResScheduled && (
                          <span className="res-sched-badge">Agendado ({new Date(res.available_at).toLocaleDateString('pt-BR')})</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {resources.length > 0 && (
              <button 
                onClick={handleDownload} 
                className="btn-gold download-bundle-btn"
                disabled={zipping}
              >
                <Download size={16} /> 
                {zipping ? 'Processando ZIP...' : resources.length > 1 ? 'Baixar Pacote (.zip)' : 'Baixar Recurso'}
              </button>
            )}
          </div>

          {/* Comments section */}
          <div className="glass-panel comments-box fade-in">
            <h2>Comentários ({comments.length})</h2>

            {/* Comment form */}
            <form onSubmit={handleAddComment} className="comment-form">
              <input 
                type="text" 
                className="premium-input comment-input" 
                placeholder="Escreva uma dúvida ou contribuição..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                required
              />
              <button type="submit" className="btn-gold send-comment-btn" disabled={submittingComment}>
                <Send size={14} />
              </button>
            </form>

            {/* Comments list */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="empty-comments">Seja o primeiro a comentar nesta aula!</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-avatar">
                      {c.author_avatar ? (
                        <img src={c.author_avatar} alt={c.author_name} />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className="comment-content">
                      <div className="comment-head">
                        <h4>{c.author_name}</h4>
                        <span className="comment-role">{c.author_role}</span>
                        <span className="comment-date">
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p>{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .player-wrapper {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .back-nav {
          margin-bottom: -10px;
        }
        .back-link {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
        }
        .back-link:hover {
          color: var(--gold);
        }
        
        .player-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        @media (min-width: 1024px) {
          .player-grid {
            grid-template-columns: 3fr 2fr;
          }
        }
        
        .video-panel {
          position: relative;
          background: #000;
          overflow: hidden;
          aspect-ratio: 16/9;
          border-color: var(--gold-border);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .video-element {
          width: 100%;
          height: 100%;
          object-fit: contain;
          outline: none;
        }
        .scheduled-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(1, 1, 5, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
          z-index: 10;
        }
        .scheduled-overlay h3 {
          font-size: 16px;
          color: #93C5FD;
          margin: 12px 0 6px 0;
        }
        .scheduled-overlay p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          max-width: 400px;
        }

        .lesson-meta-card {
          padding: 30px;
          margin-top: 24px;
        }
        .lesson-duration {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--gold);
          font-weight: 600;
          margin-bottom: 12px;
        }
        .lesson-meta-card h1 {
          font-size: 24px;
          margin-bottom: 12px;
        }
        .lesson-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .lesson-long-desc {
          margin-bottom: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-light);
        }
        .lesson-long-desc h3 {
          font-size: 15px;
          margin-bottom: 8px;
        }
        .lesson-long-desc p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .instructor-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-deep);
          border: 1px solid var(--border-light);
          padding: 16px;
          border-radius: var(--radius-md);
        }
        .instructor-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--gold-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: 700;
        }
        .instructor-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .instructor-info {
          display: flex;
          flex-direction: column;
        }
        .inst-lbl {
          font-size: 9px;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.1em;
          margin-bottom: 2px;
        }
        .instructor-info h3 {
          font-size: 14px;
        }
        .instructor-info p {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .resources-box, .comments-box {
          padding: 24px;
          margin-bottom: 24px;
        }
        .resources-box h2, .comments-box h2 {
          font-size: 18px;
          margin-bottom: 6px;
        }
        .res-desc {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        
        .resources-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .resource-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-deep);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
        }
        .res-icon-bubble {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: rgba(46, 98, 246, 0.08);
          color: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .res-meta-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .res-meta-info h4 {
          font-size: 13px;
          font-weight: 600;
        }
        .res-cat {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .res-sched-badge {
          display: inline-block;
          font-size: 9px;
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
          padding: 1px 6px;
          border-radius: 4px;
          width: fit-content;
          margin-top: 4px;
        }
        .download-bundle-btn {
          width: 100%;
        }

        .comment-form {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          margin-bottom: 24px;
        }
        .comment-input {
          flex: 1;
        }
        .send-comment-btn {
          width: 44px;
          padding: 0;
          border-radius: var(--radius-md);
        }
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 360px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .comment-item {
          display: flex;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-light);
        }
        .comment-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-card-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          font-size: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .comment-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .comment-content {
          flex: 1;
        }
        .comment-head {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .comment-head h4 {
          font-size: 13px;
        }
        .comment-role {
          font-size: 10px;
          color: var(--gold);
          font-weight: 500;
        }
        .comment-date {
          font-size: 10px;
          color: var(--text-muted);
          margin-left: auto;
        }
        .comment-content p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .empty-resources, .empty-comments {
          text-align: center;
          padding: 20px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .loader-box { display: flex; align-items: center; justify-content: center; height: 50vh; }
        .premium-loader { width: 35px; height: 35px; border: 2px solid rgba(46, 98, 246, 0.15); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

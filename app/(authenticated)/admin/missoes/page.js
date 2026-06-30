'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { 
  CheckCircle, XCircle, Clock, FileText, ExternalLink, 
  MessageSquare, User, Filter, AlertCircle, ArrowRight 
} from 'lucide-react';

export default function AdminMissionsCorrectionsPage() {
  const { user, showToast } = useAuth();
  
  const [submissions, setSubmissions] = useState([]);
  const [missions, setMissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'

  // Correction Modal States
  const [selectedSub, setSelectedSub] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, mRes, stdRes] = await Promise.all([
        fetch('/api/db?collection=submissions'),
        fetch('/api/db?collection=missions'),
        fetch('/api/db?collection=members')
      ]);

      if (sRes.ok && mRes.ok && stdRes.ok) {
        setSubmissions(await sRes.json());
        setMissions(await mRes.json());
        setStudents(await stdRes.json());
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleOpenReview = (sub) => {
    setSelectedSub(sub);
    setFeedbackText(sub.feedback || '');
  };

  const handleSaveReview = async (reviewStatus) => {
    if (!selectedSub) return;
    
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reviewSubmission',
          submissionId: selectedSub.id,
          status: reviewStatus, // 'approved' or 'rejected'
          feedback: feedbackText,
          reviewerId: user.id
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSubmissions(prev => prev.map(s => s.id === selectedSub.id ? updated : s));
        showToast(`Entrega avaliada como ${reviewStatus === 'approved' ? 'Aprovada' : 'Pendente de correções'}.`, 'success');
        setSelectedSub(null);

        // Notify member of evaluation
        const student = students.find(x => x.id === selectedSub.student_id);
        const mission = missions.find(x => x.id === selectedSub.mission_id);
        
        if (student && mission) {
          const newNotif = {
            user_id: student.id,
            title: reviewStatus === 'approved' ? 'Missão Aprovada!' : 'Missão Rejeitada (Ajustes Requeridos)',
            description: `Sua entrega para "${mission.title}" foi corrigida pelo mentor.`,
            type: 'recurso',
            link: '/missoes',
            is_read: false
          };

          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save',
              collection: 'notifications',
              document: newNotif
            })
          });
        }
      }
    } catch (err) {
      showToast('Erro ao salvar avaliação.', 'error');
    }
  };

  // Resolve visual metadata mappings for lists
  const getSubDetails = (sub) => {
    const student = students.find(s => s.id === sub.student_id) || { name: 'Membro Desconhecido', role: 'Membro', company: '' };
    const mission = missions.find(m => m.id === sub.mission_id) || { title: 'Missão Indefinida' };
    return { student, mission };
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  }).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  return (
    <div className="corrections-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">PAINEL ADMINISTRATIVO</span>
        <h1>Banca de Avaliação e Correções</h1>
        <p className="subtitle">Revise os estudos de viabilidade, pranchas e arquivos de cálculo enviados pelos mentorados. Escreva feedbacks personalizados.</p>
      </div>

      {/* Tab Filter bar */}
      <section className="tabs-bar glass-panel fade-in">
        <div className="filter-group">
          <button 
            onClick={() => setFilterStatus('pending')} 
            className={`tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          >
            <Clock size={14} /> Pendentes ({submissions.filter(x => x.status === 'pending').length})
          </button>
          <button 
            onClick={() => setFilterStatus('approved')} 
            className={`tab-btn ${filterStatus === 'approved' ? 'active' : ''}`}
          >
            <CheckCircle size={14} /> Aprovadas ({submissions.filter(x => x.status === 'approved').length})
          </button>
          <button 
            onClick={() => setFilterStatus('rejected')} 
            className={`tab-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
          >
            <XCircle size={14} /> Corrigir ({submissions.filter(x => x.status === 'rejected').length})
          </button>
          <button 
            onClick={() => setFilterStatus('all')} 
            className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
          >
            <Filter size={14} /> Todas ({submissions.length})
          </button>
        </div>
      </section>

      {/* Deliveries list */}
      <section className="submissions-list-wrapper">
        {loading ? (
          <div className="loader-box glass-panel"><div className="premium-loader"></div></div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="glass-panel empty-box">Nenhuma entrega de atividade nesta categoria.</div>
        ) : (
          <div className="subs-list">
            {filteredSubmissions.map(sub => {
              const details = getSubDetails(sub);
              
              return (
                <div key={sub.id} className={`sub-card glass-panel fade-in border-${sub.status}`}>
                  <div className="sub-header">
                    <div className="student-profile">
                      <div className="avatar-bubble">
                        {details.student.img ? (
                          <img src={details.student.img} alt={details.student.name} />
                        ) : (
                          <span>{details.student.initials}</span>
                        )}
                      </div>
                      <div>
                        <h3>{details.student.name}</h3>
                        <p>{details.student.role} • {details.student.company}</p>
                      </div>
                    </div>

                    <span className="submitted-date">
                      Enviado em: {new Date(sub.submitted_at).toLocaleDateString('pt-BR')} às {new Date(sub.submitted_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="sub-body">
                    <div className="mission-title-group">
                      <span className="task-tag">ATIVIDADE</span>
                      <h4>{details.mission.title}</h4>
                    </div>

                    {sub.text_answer && (
                      <div className="response-box">
                        <h5>Resposta Textual:</h5>
                        <p>{sub.text_answer}</p>
                      </div>
                    )}

                    <div className="links-row">
                      {sub.form_submitted_link && (
                        <a href={sub.form_submitted_link} target="_blank" rel="noopener noreferrer" className="btn-outline btn-inline">
                          <ExternalLink size={12} /> Ver Resposta Questionário
                        </a>
                      )}
                      
                      {sub.file_url && (
                        <a href={sub.file_url} download={sub.file_name} className="btn-gold btn-inline">
                          <FileText size={12} /> Baixar Arquivo ({sub.file_name})
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="sub-footer">
                    {sub.feedback && (
                      <div className="saved-feedback">
                        <span>Feedback salvo:</span>
                        <p>{sub.feedback}</p>
                      </div>
                    )}
                    
                    <button onClick={() => handleOpenReview(sub)} className="btn-gold review-btn">
                      <MessageSquare size={14} /> {sub.status === 'pending' ? 'Avaliar e Dar Feedback' : 'Editar Avaliação'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Review Modal Form */}
      {selectedSub && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card fade-in">
            <h2>Avaliar Entrega de Mentoria</h2>
            <p className="modal-sub">Membro: <strong>{getSubDetails(selectedSub).student.name}</strong> • Missão: <strong>{getSubDetails(selectedSub).mission.title}</strong></p>

            <div className="modal-form">
              <div className="input-group">
                <label className="premium-label">Feedback escrito para o Aluno</label>
                <textarea 
                  className="premium-input textarea-input" 
                  rows="5"
                  placeholder="Escreva orientações construtivas, erros observados ou justificativas de aprovação..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setSelectedSub(null)} className="btn-outline">
                  Cancelar
                </button>
                <button type="button" onClick={() => handleSaveReview('rejected')} className="btn-danger">
                  <XCircle size={14} /> Solicitar Ajustes
                </button>
                <button type="button" onClick={() => handleSaveReview('approved')} className="btn-gold">
                  <CheckCircle size={14} /> Aprovar Entrega
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .corrections-wrapper {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .welcome-tag {
          font-size: 10px;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          display: block;
        }
        .title-section h1 {
          font-size: 32px;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }

        .tabs-bar {
          padding: 10px;
        }
        .filter-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 10px 16px;
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

        .subs-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sub-card {
          padding: 24px;
          border-left: 4px solid;
          background: rgba(10, 10, 18, 0.4);
        }
        .sub-card.border-pending { border-left-color: #F59E0B; }
        .sub-card.border-approved { border-left-color: #10B981; }
        .sub-card.border-rejected { border-left-color: #EF4444; }

        .sub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .student-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar-bubble {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--gold-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #010105;
          font-weight: 700;
          overflow: hidden;
          border: 1px solid var(--gold-border);
        }
        .avatar-bubble img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .student-profile h3 {
          font-size: 14px;
          font-weight: 600;
        }
        .student-profile p {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .submitted-date {
          font-size: 11px;
          color: var(--text-muted);
        }

        .sub-body {
          margin-bottom: 20px;
        }
        .mission-title-group {
          margin-bottom: 15px;
        }
        .task-tag {
          font-size: 9px;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.05em;
          margin-bottom: 2px;
          display: block;
        }
        .mission-title-group h4 {
          font-size: 16px;
        }
        .response-box {
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 16px;
        }
        .response-box h5 {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .response-box p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .links-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-inline {
          padding: 8px 16px;
          font-size: 12px;
          height: auto;
        }

        .sub-footer {
          border-top: 1px solid var(--border-light);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }
        .saved-feedback {
          flex: 1;
          min-width: 250px;
        }
        .saved-feedback span {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
          display: block;
          margin-bottom: 2px;
        }
        .saved-feedback p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .review-btn {
          height: 38px;
          font-size: 13px;
          padding: 0 16px;
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
        .modal-card {
          width: 100%;
          max-width: 580px;
          padding: 30px;
          background: #080811;
        }
        .modal-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 20px;
        }
        .textarea-input {
          width: 100%;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .empty-box {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
        .loader-box { display: flex; align-items: center; justify-content: center; height: 150px; }
        .premium-loader { width: 30px; height: 30px; border: 2px solid rgba(237, 192, 102, 0.1); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { 
  CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, 
  Upload, FileText, Send, Globe, Download, AlertTriangle 
} from 'lucide-react';

export default function MissionsPage() {
  const { user, showToast } = useAuth();
  
  const [missions, setMissions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [expandedMissions, setExpandedMissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Form states mapped by missionId
  const [textAnswers, setTextAnswers] = useState({});
  const [formLinks, setFormLinks] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({}); // Stores File objects
  const [uploadingState, setUploadingState] = useState({}); // Stores upload progression boolean

  useEffect(() => {
    fetchMissions();
  }, [user]);

  const fetchMissions = async () => {
    if (!user) return;
    try {
      const [mRes, sRes] = await Promise.all([
        fetch('/api/db?collection=missions'),
        fetch('/api/db?collection=submissions')
      ]);

      if (mRes.ok && sRes.ok) {
        const missionsData = await mRes.json();
        const submissionsData = await sRes.json();

        setMissions(missionsData);
        
        // Filter user submissions
        const userSubs = submissionsData.filter(s => s.student_id === user.id);
        setSubmissions(userSubs);

        // Fill initial form states from existing submissions
        const textAns = {};
        const fLinks = {};
        userSubs.forEach(s => {
          textAns[s.mission_id] = s.text_answer || '';
          fLinks[s.mission_id] = s.form_submitted_link || '';
        });
        setTextAnswers(textAns);
        setFormLinks(fLinks);

        // Expand the first mission by default
        if (missionsData.length > 0) {
          setExpandedMissions({ [missionsData[0].id]: true });
        }
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const toggleMission = (id) => {
    setExpandedMissions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileChange = (missionId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      showToast('O arquivo excede o limite máximo de 100MB.', 'error');
      return;
    }

    setSelectedFiles(prev => ({ ...prev, [missionId]: file }));
    showToast(`Arquivo selecionado: ${file.name}`, 'info');
  };

  const handleSubmitMission = async (missionId, e) => {
    e.preventDefault();
    
    const mission = missions.find(m => m.id === missionId);
    const textAnswer = textAnswers[missionId] || '';
    const formLink = formLinks[missionId] || '';
    const file = selectedFiles[missionId];

    // Validation
    if (mission.has_text_question && !textAnswer.trim()) {
      showToast('Preencha a resposta textual obrigatória.', 'warning');
      return;
    }
    if (mission.has_form_link && !formLink.trim()) {
      showToast('Insira o link do formulário respondido.', 'warning');
      return;
    }
    if (mission.has_file_upload && !file && !submissions.find(s => s.mission_id === missionId)?.file_url) {
      showToast('Envie o arquivo solicitado.', 'warning');
      return;
    }

    let finalFileUrl = submissions.find(s => s.mission_id === missionId)?.file_url || '';
    let finalFileName = submissions.find(s => s.mission_id === missionId)?.file_name || '';

    // If a new file is selected, upload it first
    if (file) {
      setUploadingState(prev => ({ ...prev, [missionId]: true }));
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('studentId', user.id);

        const uploadRes = await fetch('/api/missions/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          showToast(uploadErr.error || 'Erro no upload do arquivo.', 'error');
          setUploadingState(prev => ({ ...prev, [missionId]: false }));
          return;
        }

        const uploadData = await uploadRes.json();
        finalFileUrl = uploadData.file_url;
        finalFileName = uploadData.file_name;
      } catch (err) {
        showToast('Erro de rede ao fazer upload.', 'error');
        setUploadingState(prev => ({ ...prev, [missionId]: false }));
        return;
      }
      setUploadingState(prev => ({ ...prev, [missionId]: false }));
    }

    // Submit payload
    try {
      const submissionPayload = {
        mission_id: missionId,
        student_id: user.id,
        text_answer: textAnswer,
        form_submitted_link: formLink,
        file_url: finalFileUrl,
        file_name: finalFileName
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitMission',
          submission: submissionPayload
        })
      });

      if (res.ok) {
        showToast('Missão enviada com sucesso para correção!', 'success');
        fetchMissions();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Falha ao enviar missão.', 'error');
      }
    } catch (err) {
      showToast('Erro ao submeter missão.', 'error');
    }
  };

  // Progress calculations
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const progressPercent = missions.length ? Math.round((approvedCount / missions.length) * 100) : 0;

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

  return (
    <div className="missions-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">ATIVIDADES PRÁTICAS</span>
        <h1>Central de Missões</h1>
        <p className="subtitle">Aplique os conhecimentos teóricos em entregáveis práticos de engenharia e negócios</p>
      </div>

      {/* Progress header card */}
      <section className="progress-card glass-panel fade-in">
        <div className="progress-text-row">
          <div>
            <h2>Seu Progresso Geral</h2>
            <p>{approvedCount} de {missions.length} missões aprovadas pela banca examinadora.</p>
          </div>
          <span className="pct-val">{progressPercent}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </section>

      {/* Missions list accordion */}
      <section className="missions-accordion fade-in">
        <div className="accordion-list">
          {missions.length === 0 ? (
            <div className="glass-panel empty-list">Nenhuma missão prática cadastrada no momento.</div>
          ) : (
            missions.map((mission, index) => {
              const isOpen = expandedMissions[mission.id];
              const sub = submissions.find(s => s.mission_id === mission.id);
              
              // Status mapping
              let statusLabel = 'Pendente de Envio';
              let statusClass = 'pending-send';
              let StatusIcon = Clock;

              if (sub) {
                if (sub.status === 'pending') {
                  statusLabel = 'Aguardando Correção';
                  statusClass = 'pending-review';
                  StatusIcon = Clock;
                } else if (sub.status === 'approved') {
                  statusLabel = 'Aprovada e Concluída';
                  statusClass = 'approved';
                  StatusIcon = CheckCircle;
                } else if (sub.status === 'rejected') {
                  statusLabel = 'Ajustes Requeridos';
                  statusClass = 'rejected';
                  StatusIcon = AlertCircle;
                }
              }

              const isLocked = sub?.status === 'approved';

              return (
                <div key={mission.id} className="mission-item glass-panel">
                  {/* Item Accordion Header */}
                  <div className="mission-header" onClick={() => toggleMission(mission.id)}>
                    <div className="header-left">
                      <span className="index-badge">Missão {index + 1}</span>
                      <h3>{mission.title}</h3>
                    </div>
                    <div className="header-right">
                      <span className={`status-badge ${statusClass}`}>
                        <StatusIcon size={12} /> {statusLabel}
                      </span>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Item Accordion Body */}
                  {isOpen && (
                    <div className="mission-body">
                      <div className="description-block">
                        <p>{mission.description}</p>
                      </div>

                      {/* Feedback from Mentor */}
                      {sub?.feedback && (
                        <div className={`feedback-block border-${sub.status}`}>
                          <h4>Feedback do Mentor:</h4>
                          <p>{sub.feedback}</p>
                        </div>
                      )}

                      {/* Submit form */}
                      <form onSubmit={(e) => handleSubmitMission(mission.id, e)} className="submit-form">
                        
                        {/* Text question */}
                        {mission.has_text_question && (
                          <div className="input-group">
                            <label className="premium-label">{mission.text_question || 'Resposta Textual'}</label>
                            <textarea 
                              className="premium-input textarea-input" 
                              rows="4"
                              placeholder="Escreva sua resposta teórica aqui..."
                              value={textAnswers[mission.id] || ''}
                              onChange={(e) => setTextAnswers(prev => ({ ...prev, [mission.id]: e.target.value }))}
                              disabled={isLocked}
                              required
                            />
                          </div>
                        )}

                        {/* Form link */}
                        {mission.has_form_link && (
                          <div className="input-group">
                            <label className="premium-label">Link do Questionário (Google Forms/Typeform)</label>
                            <p className="field-tip">Responda o questionário no link: <a href={mission.form_link} target="_blank" rel="noopener noreferrer" className="text-gold">{mission.form_link} <Globe size={12} style={{ display: 'inline' }} /></a> e cole o link de resposta abaixo.</p>
                            <input 
                              type="url" 
                              className="premium-input"
                              placeholder="https://docs.google.com/forms/..."
                              value={formLinks[mission.id] || ''}
                              onChange={(e) => setFormLinks(prev => ({ ...prev, [mission.id]: e.target.value }))}
                              disabled={isLocked}
                              required
                            />
                          </div>
                        )}

                        {/* File Upload */}
                        {mission.has_file_upload && (
                          <div className="input-group">
                            <label className="premium-label">{mission.file_upload_label || 'Enviar arquivo complementar'}</label>
                            
                            {/* Upload button wrapper */}
                            {!isLocked ? (
                              <div className="file-uploader-box">
                                <Upload size={18} className="upload-icon" />
                                <input 
                                  type="file" 
                                  onChange={(e) => handleFileChange(mission.id, e)}
                                  className="file-input-hidden"
                                />
                                <span className="upload-text">
                                  {selectedFiles[mission.id] ? selectedFiles[mission.id].name : 'Selecionar arquivo de até 100MB'}
                                </span>
                              </div>
                            ) : null}

                            {sub?.file_url && (
                              <div className="uploaded-file-row">
                                <FileText size={16} className="text-gold" />
                                <span className="file-name">{sub.file_name || 'arquivo_de_entrega'}</span>
                                <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="btn-outline btn-download-file">
                                  <Download size={12} /> Download
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        {!isLocked && (
                          <div className="form-actions">
                            <button 
                              type="submit" 
                              className="btn-gold submit-btn"
                              disabled={uploadingState[mission.id]}
                            >
                              <Send size={14} /> 
                              {uploadingState[mission.id] ? 'Enviando arquivo...' : sub?.status === 'rejected' ? 'Reenviar Missão' : 'Enviar Missão'}
                            </button>
                          </div>
                        )}

                        {isLocked && (
                          <div className="locked-badge-row">
                            <CheckCircle size={16} />
                            <span>Entrega finalizada e arquivada. Não são permitidas alterações.</span>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <style jsx>{`
        .missions-wrapper {
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

        .progress-card {
          padding: 24px;
          border-color: var(--border-light);
          background: var(--bg-card);
          box-shadow: var(--shadow-premium);
          border-radius: var(--radius-md);
        }
        .progress-text-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .progress-text-row h2 {
          font-size: 18px;
        }
        .progress-text-row p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .pct-val {
          font-size: 28px;
          font-weight: 800;
          color: var(--gold);
          font-family: var(--font-title);
        }
        .progress-bar-container {
          height: 8px;
          background: var(--border-light);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--gold-gradient);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .accordion-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mission-item {
          border-color: var(--gold-border);
          overflow: hidden;
        }
        .mission-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .mission-header:hover {
          background: var(--bg-card-hover);
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .index-badge {
          font-size: 10px;
          font-weight: 700;
          color: var(--gold);
          text-transform: uppercase;
          background: rgba(46, 98, 246, 0.08);
          padding: 4px 10px;
          border-radius: 4px;
        }
        .header-left h3 {
          font-size: 15px;
          font-weight: 600;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 30px;
        }
        .status-badge.pending-send {
          background: var(--bg-deep);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
        }
        .status-badge.pending-review {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #F59E0B;
        }
        .status-badge.approved {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10B981;
        }
        .status-badge.rejected {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #EF4444;
        }

        .mission-body {
          border-top: 1px solid var(--border-light);
          padding: 24px;
          background: var(--bg-deep);
        }
        .description-block {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
        }
        
        .feedback-block {
          padding: 16px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
          font-size: 13px;
          line-height: 1.5;
          border: 1px solid transparent;
        }
        .feedback-block.border-approved {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
          color: #065f46;
        }
        .feedback-block.border-rejected {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.2);
          color: #991b1b;
        }
        .feedback-block h4 {
          margin-bottom: 4px;
        }

        .submit-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .field-tip {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 6px;
          margin-top: -2px;
        }
        .file-uploader-box {
          border: 1px dashed var(--border-light);
          background: var(--bg-card);
          border-radius: var(--radius-md);
          padding: 20px;
          text-align: center;
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: var(--transition-smooth);
        }
        .file-uploader-box:hover {
          border-color: var(--gold-border);
          background: rgba(46, 98, 246, 0.04);
        }
        .file-input-hidden {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        .upload-icon {
          color: var(--text-secondary);
        }
        .upload-text {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .uploaded-file-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(46, 98, 246, 0.04);
          border: 1px solid var(--gold-border);
          border-radius: var(--radius-sm);
          margin-top: 10px;
        }
        .file-name {
          font-size: 13px;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .btn-download-file {
          padding: 6px 12px;
          font-size: 11px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .submit-btn {
          min-width: 160px;
        }
        .locked-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #10B981;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 12px;
          border-radius: var(--radius-sm);
          margin-top: 10px;
        }
        .empty-list {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

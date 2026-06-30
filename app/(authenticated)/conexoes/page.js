'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { 
  User, Compass, Network, Check, X, UserCheck, 
  UserPlus, UserMinus, Search, Globe, Linkedin, Instagram 
} from 'lucide-react';

export default function ConnectionsPage() {
  const { user, updateProfile, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil', 'rede', 'descobrir'
  const [members, setMembers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Editable Profile States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setRole(user.role || '');
      setCompany(user.company || '');
      setIndustry(user.industry || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      setAvatarUrl(user.img || '');
      setLinkedin(user.linkedin || '');
      setInstagram(user.instagram || '');
      setWebsite(user.website || '');
    }
  }, [user]);

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch('/api/db?collection=members'),
        fetch('/api/db?collection=connections')
      ]);
      if (mRes.ok && cRes.ok) {
        setMembers(await mRes.json());
        setConnections(await cRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Profile Save Action
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    // 1. Username Regex Validation (PRD 4.7: "letras minúsculas, números, sublinhas (_) ou pontos (.)")
    const usernameRegex = /^[a-z0-9_.]+$/;
    if (username && !usernameRegex.test(username)) {
      showToast('O nome de usuário deve conter apenas letras minúsculas, números, sublinhas (.) ou pontos (.).', 'error');
      setSavingProfile(false);
      return;
    }

    // 2. Username Uniqueness Validation (PRD 4.7)
    const taken = members.some(m => m.id !== user.id && m.username && m.username.toLowerCase() === username.toLowerCase());
    if (taken) {
      showToast('Este nome de usuário já está sendo utilizado.', 'error');
      setSavingProfile(false);
      return;
    }

    const success = await updateProfile({
      name,
      username,
      role,
      company,
      industry,
      location,
      bio,
      img: avatarUrl,
      linkedin,
      instagram,
      website
    });

    if (success) {
      fetchNetwork();
    }
    setSavingProfile(false);
  };

  // Avatar Upload simulation (File upload validation < 2MB, PRD 4.7)
  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('O tamanho do avatar deve ser inferior a 2MB.', 'error');
      return;
    }

    // Simulated local reader to get dataURL
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result);
      showToast('Imagem carregada localmente (Salvar Perfil para confirmar).', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Connection management dispatches
  const handleManageConnection = async (targetId, action) => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manageConnection',
          requesterId: user.id,
          receiverId: targetId,
          status: action // 'pending', 'accepted', 'rejected', 'remove'
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Reload connections
        const updatedConnectionsRes = await fetch('/api/db?collection=connections');
        if (updatedConnectionsRes.ok) {
          setConnections(await updatedConnectionsRes.json());
        }

        if (action === 'pending') showToast('Solicitação de conexão enviada!', 'success');
        if (action === 'accepted') showToast('Conexão aceita com sucesso!', 'success');
        if (action === 'rejected') showToast('Solicitação recusada.', 'info');
        if (action === 'remove') showToast('Conexão desfeita.', 'info');
      }
    } catch (err) {
      showToast('Erro ao atualizar rede.', 'error');
    }
  };

  // Network filter groupings
  const myConnections = members.filter(m => {
    if (m.id === user.id) return false;
    return connections.some(c => 
      c.status === 'accepted' && 
      ((c.requester_id === user.id && c.receiver_id === m.id) || 
       (c.requester_id === m.id && c.receiver_id === user.id))
    );
  });

  const pendingRequests = members.filter(m => {
    if (m.id === user.id) return false;
    return connections.some(c => 
      c.status === 'pending' && c.requester_id === m.id && c.receiver_id === user.id
    );
  });

  const sentPendingRequests = members.filter(m => {
    if (m.id === user.id) return false;
    return connections.some(c => 
      c.status === 'pending' && c.requester_id === user.id && c.receiver_id === m.id
    );
  });

  // Discovery members filter: not connected and not pending, not current user
  const discoveryMembers = members.filter(m => {
    if (m.id === user.id) return false;
    
    // Check connection existence
    const hasConnection = connections.some(c => 
      (c.requester_id === user.id && c.receiver_id === m.id) || 
      (c.requester_id === m.id && c.receiver_id === user.id)
    );

    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText = (m.name + ' ' + (m.company || '') + ' ' + (m.role || '')).toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return !hasConnection;
  });

  return (
    <div className="connections-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">NETWORK & PERFIL</span>
        <h1>Conexões e Rede</h1>
        <p className="subtitle">Gerencie suas informações profissionais e interaja com os mentorados do WHITECLUB</p>
      </div>

      {/* Tabs navigation bar */}
      <section className="tabs-header glass-panel fade-in">
        <button 
          onClick={() => setActiveTab('perfil')} 
          className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`}
        >
          <User size={16} /> Meu Perfil
        </button>
        <button 
          onClick={() => setActiveTab('rede')} 
          className={`tab-btn ${activeTab === 'rede' ? 'active' : ''}`}
        >
          <Network size={16} /> Minha Rede ({myConnections.length + pendingRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('descobrir')} 
          className={`tab-btn ${activeTab === 'descobrir' ? 'active' : ''}`}
        >
          <Compass size={16} /> Descobrir Membros
        </button>
      </section>

      {/* View router switcher */}
      {activeTab === 'perfil' && (
        <form onSubmit={handleSaveProfile} className="glass-panel profile-container fade-in">
          <div className="avatar-upload-row">
            <div className="avatar-bubble-large">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar Preview" /> : <span>{user?.initials}</span>}
            </div>
            <div className="avatar-upload-actions">
              <label className="premium-label">Foto de Perfil (Max. 2MB)</label>
              <input type="file" accept="image/*" onChange={handleAvatarFile} className="file-input-selector" />
              <p className="upload-tip">Envie JPG, PNG ou WEBP para atualizar o rosto no feed.</p>
            </div>
          </div>

          <div className="form-fields-grid">
            <div className="input-group">
              <label className="premium-label">Nome Completo</label>
              <input type="text" className="premium-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="input-group">
              <label className="premium-label">Nome de Usuário (username)</label>
              <input type="text" className="premium-input" placeholder="ex: carlos.lima" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className="input-group">
              <label className="premium-label">Cargo / Posição</label>
              <input type="text" className="premium-input" placeholder="Ex: Diretor Técnico" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="premium-label">Empresa</label>
              <input type="text" className="premium-input" placeholder="Ex: WHITECLUB" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="premium-label">Indústria / Área</label>
              <input type="text" className="premium-input" placeholder="Ex: Engenharia Civil" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="premium-label">Localização</label>
              <input type="text" className="premium-input" placeholder="Ex: São Paulo, SP" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="input-group full-width">
              <label className="premium-label">Biografia Profissional</label>
              <textarea className="premium-input textarea-input" rows="3" placeholder="Fale um pouco sobre sua carreira, foco de investimentos e formação..." value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="premium-label"><Linkedin size={12} style={{ marginRight: '4px' }} /> LinkedIn Link</label>
              <input type="url" className="premium-input" placeholder="https://linkedin.com/in/..." value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="premium-label"><Instagram size={12} style={{ marginRight: '4px' }} /> Instagram Username</label>
              <input type="text" className="premium-input" placeholder="ex: carlos_lima" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </div>

            <div className="input-group full-width">
              <label className="premium-label"><Globe size={12} style={{ marginRight: '4px' }} /> Website corporativo</label>
              <input type="url" className="premium-input" placeholder="https://www.minhaempresa.com.br" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </div>

          <div className="profile-save-footer">
            <button type="submit" className="btn-gold" disabled={savingProfile}>
              {savingProfile ? 'Salvando alterações...' : 'Salvar Meu Perfil'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'rede' && (
        <div className="network-container fade-in">
          {/* Pending Requests Incoming */}
          {pendingRequests.length > 0 && (
            <div className="network-section glass-panel">
              <h2>Solicitações Recebidas ({pendingRequests.length})</h2>
              <div className="cards-list">
                {pendingRequests.map(m => (
                  <div key={m.id} className="member-card-network glass-panel">
                    <div className="card-top">
                      <div className="avatar-bubble">
                        {m.img ? <img src={m.img} alt={m.name} /> : <span>{m.initials}</span>}
                      </div>
                      <div className="card-head-info">
                        <h3>{m.name}</h3>
                        <p>{m.role} @ {m.company || 'WHITECLUB'}</p>
                        <span className="location">{m.location}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        onClick={() => handleManageConnection(m.id, 'accepted')} 
                        className="btn-gold accept-btn"
                      >
                        <Check size={14} /> Aceitar
                      </button>
                      <button 
                        onClick={() => handleManageConnection(m.id, 'rejected')} 
                        className="btn-danger reject-btn"
                      >
                        <X size={14} /> Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Connections Grid */}
          <div className="network-section glass-panel">
            <h2>Suas Conexões ({myConnections.length})</h2>
            {myConnections.length === 0 ? (
              <p className="empty-text">Nenhuma conexão ativa na sua rede profissional. Vá na aba Descobrir para fazer novas solicitações!</p>
            ) : (
              <div className="cards-list grid-columns">
                {myConnections.map(m => (
                  <div key={m.id} className="member-card-network glass-panel">
                    <div className="card-top">
                      <div className="avatar-bubble">
                        {m.img ? <img src={m.img} alt={m.name} /> : <span>{m.initials}</span>}
                      </div>
                      <div className="card-head-info">
                        <h3>{m.name}</h3>
                        <p>{m.role} @ {m.company || 'WHITECLUB'}</p>
                        <span className="location">{m.location}</span>
                      </div>
                    </div>
                    
                    {m.bio && <p className="member-card-bio">{m.bio.substring(0, 100)}...</p>}

                    <div className="card-socials-row">
                      {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={16} /></a>}
                      {m.instagram && <a href={`https://instagram.com/${m.instagram}`} target="_blank" rel="noopener noreferrer"><Instagram size={16} /></a>}
                      {m.website && <a href={m.website} target="_blank" rel="noopener noreferrer"><Globe size={16} /></a>}
                    </div>

                    <div className="card-actions">
                      <button 
                        onClick={() => handleManageConnection(m.id, 'remove')} 
                        className="btn-danger remove-btn"
                      >
                        <UserMinus size={14} /> Desfazer Conexão
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'descobrir' && (
        <div className="discovery-container fade-in">
          <div className="glass-panel search-panel">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                className="premium-input search-input" 
                placeholder="Buscar membros por nome, cargo ou empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="network-section glass-panel">
            <h2>Membros do Ecossistema ({discoveryMembers.length})</h2>
            {discoveryMembers.length === 0 ? (
              <p className="empty-text">Nenhum membro não conectado disponível para busca.</p>
            ) : (
              <div className="cards-list grid-columns">
                {discoveryMembers.map(m => {
                  // Check if we sent pending request
                  const isSentPending = sentPendingRequests.some(x => x.id === m.id);

                  return (
                    <div key={m.id} className="member-card-network glass-panel">
                      <div className="card-top">
                        <div className="avatar-bubble">
                          {m.img ? <img src={m.img} alt={m.name} /> : <span>{m.initials}</span>}
                        </div>
                        <div className="card-head-info">
                          <h3>{m.name}</h3>
                          <p>{m.role} @ {m.company || 'WHITECLUB'}</p>
                          <span className="location">{m.location}</span>
                        </div>
                      </div>
                      
                      {m.bio && <p className="member-card-bio">{m.bio.substring(0, 100)}...</p>}

                      <div className="card-actions">
                        {isSentPending ? (
                          <button disabled className="btn-outline pending-btn">
                            Aguardando Aceite
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleManageConnection(m.id, 'pending')} 
                            className="btn-gold connect-btn"
                          >
                            <UserPlus size={14} /> Solicitar Conexão
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .connections-wrapper {
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

        .tabs-header {
          padding: 10px;
          display: flex;
          gap: 8px;
          border-radius: var(--radius-md);
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 10px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px;
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

        .profile-container {
          padding: 35px;
          border-color: var(--gold-border);
        }
        .avatar-upload-row {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 35px;
          padding-bottom: 25px;
          border-bottom: 1px solid var(--border-light);
        }
        .avatar-bubble-large {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: var(--gold-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #010105;
          font-weight: 800;
          font-size: 28px;
          overflow: hidden;
          border: 2px solid var(--gold-border);
          box-shadow: var(--shadow-gold);
        }
        .avatar-bubble-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-upload-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .file-input-selector {
          color: var(--text-secondary);
          font-size: 12px;
        }
        .upload-tip {
          font-size: 11px;
          color: var(--text-muted);
        }

        .form-fields-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .form-fields-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .profile-save-footer {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }

        .network-container, .discovery-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .network-section {
          padding: 24px;
          border-color: var(--gold-border);
        }
        .network-section h2 {
          font-size: 18px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 10px;
        }
        .cards-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cards-list.grid-columns {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .cards-list.grid-columns {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 1200px) {
          .cards-list.grid-columns {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .member-card-network {
          padding: 20px;
          background: rgba(255, 255, 255, 0.01);
          border-color: var(--border-light);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        .card-top {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 12px;
        }
        .avatar-bubble {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--gold-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #010105;
          font-weight: bold;
          overflow: hidden;
          border: 1px solid var(--gold-border);
          flex-shrink: 0;
        }
        .avatar-bubble img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .card-head-info h3 {
          font-size: 14px;
          font-weight: 600;
        }
        .card-head-info p {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .card-head-info .location {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
          display: block;
        }
        .member-card-bio {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .card-socials-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          color: var(--text-secondary);
        }
        .card-socials-row a {
          color: var(--text-secondary);
          transition: var(--transition-smooth);
        }
        .card-socials-row a:hover {
          color: var(--gold);
        }
        .card-actions {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }
        .accept-btn, .reject-btn, .remove-btn, .connect-btn {
          flex: 1;
          height: 36px;
          padding: 0;
          font-size: 12px;
          border-radius: var(--radius-sm);
        }
        .pending-btn {
          width: 100%;
          height: 36px;
          font-size: 12px;
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .search-panel {
          padding: 16px;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }
        .search-input {
          padding-left: 42px;
        }
        .empty-text {
          font-size: 13px;
          color: var(--text-muted);
          text-align: center;
          padding: 20px 0;
        }
      `}</style>
    </div>
  );
}

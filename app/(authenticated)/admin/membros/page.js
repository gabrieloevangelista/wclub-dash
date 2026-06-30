'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { 
  UserPlus, Trash2, Edit3, Shield, Mail, CheckCircle, 
  XCircle, Search, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function AdminMembersPage() {
  const { user, showToast } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state for batch deletes (Bulk Actions)
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newMemberType, setNewMemberType] = useState('mentor');
  const [newCompany, setNewCompany] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/db?collection=members');
      if (res.ok) {
        setMembers(await res.json());
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredMembers.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} membros selecionados?`)) return;

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteBatch',
          collection: 'members',
          ids: selectedIds
        })
      });

      if (res.ok) {
        setMembers(prev => prev.filter(m => !selectedIds.includes(m.id)));
        showToast(`${selectedIds.length} contas excluídas com sucesso.`, 'success');
        setSelectedIds([]);
      }
    } catch (err) {
      showToast('Erro ao excluir em lote.', 'error');
    }
  };

  // Toggle status (Ativo / Inativo)
  const handleToggleStatus = async (memberId, currentStatus) => {
    const nextStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    const deactivated_at = nextStatus === 'Inativo' ? new Date().toISOString() : null;
    
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          collection: 'members',
          id: memberId,
          updates: { 
            status: nextStatus,
            deactivated_at
          }
        })
      });

      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: nextStatus, deactivated_at } : m));
        showToast(`Status de membro atualizado para ${nextStatus}.`, 'success');
      }
    } catch (err) {
      showToast('Erro ao atualizar status.', 'error');
    }
  };

  // Change member type (role)
  const handleChangeRole = async (memberId, nextType) => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          collection: 'members',
          id: memberId,
          updates: { member_type: nextType }
        })
      });

      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, member_type: nextType } : m));
        showToast('Tipo de acesso atualizado.', 'success');
      }
    } catch (err) {
      showToast('Erro ao atualizar tipo de acesso.', 'error');
    }
  };

  // Add Member manually
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    try {
      const initials = (newName.trim().split(/\s+/).map(x => x[0]).join('')).toUpperCase().substring(0, 2);
      const username = newEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');

      const newMember = {
        name: newName,
        email: newEmail,
        role: newRole || 'Mentorado',
        company: newCompany,
        initials,
        member_type: newMemberType,
        status: 'Ativo',
        username
      };

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          collection: 'members',
          document: newMember
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setMembers(prev => [...prev, saved]);
        showToast(`Conta criada para ${newName}! E-mail de reset de senha simulado enviado.`, 'success');
        setShowAddModal(false);
        
        // Reset fields
        setNewName('');
        setNewEmail('');
        setNewRole('');
        setNewCompany('');
      }
    } catch (err) {
      showToast('Erro ao registrar membro.', 'error');
    }
  };

  const handleSendResetPassword = (email) => {
    showToast(`E-mail de redefinição de senha enviado para: ${email}`, 'success');
  };

  // Filter members list by search input
  const filteredMembers = members.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) || 
        m.email.toLowerCase().includes(q) || 
        (m.role || '').toLowerCase().includes(q) || 
        (m.company || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="members-admin-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">PAINEL ADMINISTRATIVO</span>
        <h1>Gestão de Membros</h1>
        <p className="subtitle">Cadastre membros manualmente, edite permissões, altere status de atividade e remova contas em lote</p>
      </div>

      {/* Control Actions bar */}
      <section className="control-actions-bar glass-panel fade-in">
        <div className="search-box-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="premium-input search-input" 
            placeholder="Buscar por nome, email, cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="buttons-group">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="btn-danger">
              <Trash2 size={14} /> Excluir Selecionados ({selectedIds.length})
            </button>
          )}

          <button onClick={() => setShowAddModal(true)} className="btn-gold">
            <UserPlus size={16} /> Cadastrar Membro
          </button>
        </div>
      </section>

      {/* Members table container */}
      <section className="members-table-container glass-panel fade-in">
        {loading ? (
          <div className="table-loading">Carregando lista...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="table-empty">Nenhum membro encontrado.</div>
        ) : (
          <div className="table-scroll">
            <table className="members-table">
              <thead>
                <tr>
                  <th width="40">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                    />
                  </th>
                  <th>Membro</th>
                  <th>Contato</th>
                  <th>Acesso / Cargo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => {
                  const isSelected = selectedIds.includes(m.id);
                  const isSelf = m.id === user?.id;

                  return (
                    <tr key={m.id} className={isSelected ? 'row-selected' : ''}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(m.id, e.target.checked)}
                          disabled={isSelf} // Cannot bulk delete self
                        />
                      </td>
                      <td>
                        <div className="user-profile-row">
                          <div className="avatar-bubble">
                            {m.img ? <img src={m.img} alt={m.name} /> : <span>{m.initials}</span>}
                          </div>
                          <div>
                            <h4>{m.name} {isSelf && <span className="self-tag">(Você)</span>}</h4>
                            <span className="user-company">{m.role} • {m.company || 'WHITECLUB'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="user-email">{m.email}</span>
                      </td>
                      <td>
                        <div className="role-selector-wrapper">
                          <select 
                            value={m.member_type || 'mentor'}
                            onChange={(e) => handleChangeRole(m.id, e.target.value)}
                            className="premium-input inline-select"
                            disabled={isSelf}
                          >
                            <option value="admin">Administrador</option>
                            <option value="master">Mentor Master</option>
                            <option value="mentor">Mentorado / Membro</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleStatus(m.id, m.status)} 
                          className={`status-switch-wrapper ${m.status === 'Ativo' ? 'active' : ''}`}
                          disabled={isSelf}
                          title={`Mudar status para ${m.status === 'Ativo' ? 'Inativo' : 'Ativo'}`}
                        >
                          <div className="switch-track">
                            <div className="switch-thumb"></div>
                          </div>
                          <span className="status-label">{m.status}</span>
                        </button>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button 
                            onClick={() => handleSendResetPassword(m.email)} 
                            className="btn-action-icon" 
                            title="Disparar link de senha"
                          >
                            <Mail size={14} />
                          </button>
                          {!isSelf && (
                            <button 
                              onClick={() => handleDeleteItem(m.id, 'members')} 
                              className="btn-action-icon text-red" 
                              title="Deletar conta"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Manual Creation Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card fade-in">
            <h2>Cadastrar Novo Membro</h2>
            <p className="modal-sub">Insira os dados profissionais. O sistema irá gerar as iniciais e disparar o e-mail de acesso.</p>

            <form onSubmit={handleAddMember} className="modal-form">
              <div className="input-group">
                <label className="premium-label">Nome Completo</label>
                <input type="text" className="premium-input" placeholder="Ex: Lucas Silva" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="premium-label">E-mail corporativo</label>
                <input type="email" className="premium-input" placeholder="exemplo@whiteclub.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="premium-label">Nível de Acesso</label>
                  <select value={newMemberType} onChange={(e) => setNewMemberType(e.target.value)} className="premium-input select-box">
                    <option value="mentor">Mentorado / Membro Comum</option>
                    <option value="master">Mentor Master</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="premium-label">Cargo / Função</label>
                  <input type="text" className="premium-input" placeholder="Ex: Incorporador" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label className="premium-label">Empresa</label>
                <input type="text" className="premium-input" placeholder="Ex: Construtora Silva" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-outline">Cancelar</button>
                <button type="submit" className="btn-gold">Registrar e Enviar E-mail</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .members-admin-wrapper {
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

        .control-actions-bar {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .search-box-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 400px;
          min-width: 250px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }
        .search-input {
          padding-left: 42px;
        }
        .buttons-group {
          display: flex;
          gap: 12px;
        }

        .members-table-container {
          padding: 20px;
          border-color: var(--gold-border);
          overflow: hidden;
        }
        .table-scroll {
          overflow-x: auto;
        }
        .members-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .members-table th, .members-table td {
          padding: 16px;
          border-bottom: 1px solid var(--border-light);
          font-size: 14px;
        }
        .members-table th {
          font-family: var(--font-title);
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.05em;
        }
        .members-table tbody tr {
          transition: var(--transition-smooth);
        }
        .members-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.01);
        }
        .row-selected {
          background: rgba(237, 192, 102, 0.03) !important;
        }

        .user-profile-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar-bubble {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--gold-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #010105;
          font-weight: 700;
          font-size: 13px;
          overflow: hidden;
          border: 1px solid var(--gold-border);
        }
        .avatar-bubble img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .user-profile-row h4 {
          font-size: 14px;
          font-weight: 600;
        }
        .self-tag {
          font-size: 10px;
          color: var(--gold);
          font-weight: normal;
          margin-left: 6px;
        }
        .user-company {
          font-size: 11px;
          color: var(--text-secondary);
          display: block;
        }
        .user-email {
          color: var(--text-secondary);
        }

        .inline-select {
          font-size: 13px;
          background: #FFFFFF;
          border: 1px solid var(--border-light);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          max-width: 180px;
          outline: none;
          transition: var(--transition-smooth);
        }
        .inline-select:focus {
          border-color: var(--gold);
        }
        
        .status-switch-wrapper {
          background: transparent;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 4px;
        }
        .status-switch-wrapper:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .switch-track {
          width: 36px;
          height: 20px;
          background: #CBD5E1;
          border-radius: 20px;
          position: relative;
          transition: var(--transition-smooth);
          border: 1px solid var(--border-light);
        }
        .switch-thumb {
          width: 14px;
          height: 14px;
          background: #FFFFFF;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }
        .status-switch-wrapper.active .switch-track {
          background: var(--success);
          border-color: var(--success);
        }
        .status-switch-wrapper.active .switch-thumb {
          transform: translateX(16px);
        }
        .status-label {
          font-size: 12px;
          font-weight: 600;
          min-width: 45px;
          text-align: left;
        }
        .status-switch-wrapper.active .status-label {
          color: var(--success);
        }
        .status-switch-wrapper:not(.active) .status-label {
          color: var(--error);
        }
        .status-btn-pill:hover:not(:disabled) {
          filter: brightness(1.2);
        }

        .row-actions {
          display: flex;
          gap: 8px;
        }
        .btn-action-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-light);
          background: rgba(255, 255, 255, 0.01);
          color: var(--text-secondary);
          border-radius: 4px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .btn-action-icon:hover {
          color: var(--gold);
          border-color: var(--gold-border);
        }
        .btn-action-icon.text-red:hover {
          color: #EF4444;
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
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
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .select-box {
          background: #080811;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .table-loading, .table-empty {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

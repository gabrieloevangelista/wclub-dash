'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { Plus, ArrowUp, ArrowDown, Trash2, Eye, EyeOff, Edit } from 'lucide-react';
import Link from 'next/link';

export default function AdminEcosystemPage() {
  const { showToast } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/db?collection=banners');
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
        setBanners(data);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleToggleDisabled = async (banner) => {
    const nextDisabled = !banner.disabled;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          collection: 'banners',
          id: banner.id,
          updates: { disabled: nextDisabled }
        })
      });

      if (res.ok) {
        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, disabled: nextDisabled } : b));
        showToast(nextDisabled ? 'Banner desativado.' : 'Banner ativado publicamente!', 'success');
      }
    } catch (err) {
      showToast('Erro ao atualizar banner.', 'error');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm('Deseja realmente remover este banner?')) return;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          collection: 'banners',
          id
        })
      });
      if (res.ok) {
        setBanners(prev => prev.filter(x => x.id !== id));
        showToast('Banner excluído com sucesso.', 'success');
      }
    } catch (err) {
      showToast('Erro ao excluir banner.', 'error');
    }
  };

  // Reordenação Flexível (PRD 4.9: "atualizando sequence_order de forma paralela no banco de dados")
  const handleMove = async (bannerId, direction) => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateBannersOrder',
          bannerId,
          direction
        })
      });

      if (res.ok) {
        const updatedList = await res.json();
        updatedList.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
        setBanners(updatedList);
        showToast('Ordem de banners atualizada.', 'success');
      }
    } catch (err) {
      showToast('Falha ao reordenar.', 'error');
    }
  };

  return (
    <div className="banners-admin-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">PAINEL ADMINISTRATIVO</span>
        <h1>Gestão de Banners do Ecossistema</h1>
        <p className="subtitle">Controle as lâminas em destaque rotativo na página do Ecossistema. Altere a ordem ou ative/desative slides.</p>
      </div>

      {/* Action Header bar */}
      <section className="control-bar glass-panel fade-in">
        <h2>Lista de Slides Cadastrados ({banners.length})</h2>
        <Link href="/admin/ecossistema/novo" className="btn-gold">
          <Plus size={16} /> Novo Slide
        </Link>
      </section>

      {/* List of Banners */}
      {loading ? (
        <div className="loader-box glass-panel"><div className="premium-loader"></div></div>
      ) : banners.length === 0 ? (
        <div className="glass-panel empty-box">Nenhum banner cadastrado.</div>
      ) : (
        /* List Mode view table */
        <div className="banners-list-table glass-panel fade-in">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Ordem</th>
                <th style={{ width: '120px' }}>Imagem</th>
                <th style={{ width: '220px' }}>Título / Tag</th>
                <th>Descrição</th>
                <th style={{ width: '220px' }}>Ação de Destino</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner, index) => (
                <tr key={banner.id} className={banner.disabled ? 'row-disabled' : ''}>
                  <td>
                    <div className="list-order-cell">
                      <strong className="order-num">#{index + 1}</strong>
                      <div className="order-arrows">
                        <button 
                          onClick={() => handleMove(banner.id, 'up')} 
                          disabled={index === 0} 
                          className="btn-order-mini"
                          title="Subir ordem"
                        >
                          <ArrowUp size={10} />
                        </button>
                        <button 
                          onClick={() => handleMove(banner.id, 'down')} 
                          disabled={index === banners.length - 1} 
                          className="btn-order-mini"
                          title="Descer ordem"
                        >
                          <ArrowDown size={10} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="list-img-thumb">
                      <img src={banner.image} alt={banner.title} />
                      {banner.disabled && <span className="ocultado-overlay">Ocultado</span>}
                    </div>
                  </td>
                  <td>
                    <div className="list-title-cell">
                      <strong>{banner.title}</strong>
                      <span className="list-tag">{banner.tag}</span>
                    </div>
                  </td>
                  <td>
                    <p className="list-desc">{banner.description}</p>
                  </td>
                  <td>
                    <span className="list-cta">{banner.cta_text} → <span className="cta-url">{banner.cta_link}</span></span>
                  </td>
                  <td>
                    <div className="list-actions-cell">
                      <Link 
                        href={`/admin/ecossistema/editar/${banner.id}`} 
                        className="btn-action-icon"
                        title="Editar Slide"
                      >
                        <Edit size={14} />
                      </Link>
                      <button 
                        onClick={() => handleToggleDisabled(banner)} 
                        className={`btn-action-icon ${banner.disabled ? 'inactive' : 'active'}`}
                        title={banner.disabled ? 'Exibir no portal' : 'Ocultar do portal'}
                      >
                        {banner.disabled ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteBanner(banner.id)} 
                        className="btn-action-icon text-red"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .banners-admin-wrapper {
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

        .control-bar {
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .control-bar h2 {
          font-size: 18px;
        }

        .banners-list-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .banners-list-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .banner-admin-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-color: var(--gold-border);
          height: 100%;
        }
        .banner-admin-card.is-disabled {
          opacity: 0.65;
        }
        .banner-preview {
          height: 160px;
          position: relative;
        }
        .banner-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .banner-tag-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--gold-gradient);
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .disabled-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(1, 1, 5, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: bold;
          color: #EF4444;
        }

        .banner-details {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .sequence-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .banner-details h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }
        .banner-details p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
          flex: 1;
        }
        .cta-preview {
          font-size: 11px;
          font-family: monospace;
          color: var(--gold);
          background: rgba(46, 98, 246, 0.06);
          padding: 6px;
          border-radius: 4px;
          margin-bottom: 20px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .card-footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-light);
          padding-top: 15px;
        }
        .order-actions {
          display: flex;
          gap: 6px;
        }
        .btn-order {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }
        .btn-order:hover:not(:disabled) {
          color: var(--gold);
          border-color: var(--gold-border);
        }
        .btn-order:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .crud-actions {
          display: flex;
          gap: 8px;
        }
        .btn-action-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-light);
          border-radius: 4px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .btn-action-icon.active {
          color: var(--gold);
          border-color: var(--gold-border);
        }
        .btn-action-icon.text-red:hover {
          color: #EF4444;
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
        }

        .empty-box {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
        .loader-box { display: flex; align-items: center; justify-content: center; height: 150px; }
        .premium-loader { width: 30px; height: 30px; border: 2px solid rgba(46, 98, 246, 0.15); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* View Toggle control styling */
        .view-toggle-buttons {
          display: flex;
          background: var(--bg-deep);
          border: 1px solid var(--border-light);
          padding: 4px;
          border-radius: 30px;
        }
        .toggle-view-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 550;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .toggle-view-btn.active {
          background: var(--gold);
          color: #FFFFFF;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        /* List View Table layout */
        .banners-list-table {
          padding: 10px;
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light);
        }
        .admin-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-light);
          font-size: 13px;
          vertical-align: middle;
        }
        .admin-table tbody tr {
          transition: background-color 0.2s;
        }
        .admin-table tbody tr:hover {
          background-color: var(--bg-deep);
        }
        .row-disabled {
          opacity: 0.6;
        }
        .list-order-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .order-num {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .order-arrows {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .btn-order-mini {
          border: 1px solid var(--border-light);
          background: #FFFFFF;
          color: var(--text-secondary);
          border-radius: 3px;
          width: 18px;
          height: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-order-mini:hover:not(:disabled) {
          border-color: var(--gold);
          color: var(--gold);
        }
        .btn-order-mini:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
        .list-img-thumb {
          width: 90px;
          height: 60px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          position: relative;
        }
        .list-img-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ocultado-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(1, 1, 5, 0.6);
          color: #EF4444;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .list-title-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .list-tag {
          font-size: 9px;
          font-weight: 700;
          color: #FFFFFF;
          background: var(--gold-gradient);
          padding: 1px 6px;
          border-radius: 3px;
          align-self: flex-start;
          text-transform: uppercase;
        }
        .list-desc {
          color: var(--text-secondary);
          line-height: 1.4;
          max-width: 400px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .list-cta {
          font-family: var(--font-title);
          font-size: 12px;
          color: var(--gold);
          font-weight: 600;
        }
        .cta-url {
          font-family: monospace;
          color: var(--text-muted);
          font-weight: normal;
        }
        .list-actions-cell {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }
      `}</style>
    </div>
  );
}

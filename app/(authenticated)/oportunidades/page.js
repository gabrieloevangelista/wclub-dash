'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { Building, TrendingUp, DollarSign, Clock, ShieldCheck, FileText, CheckCircle } from 'lucide-react';

export default function OpportunitiesPage() {
  const { showToast } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal pitch details
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [manifesting, setManifesting] = useState(false);

  const fetchOpportunities = async () => {
    try {
      const res = await fetch('/api/db?collection=opportunities');
      if (res.ok) {
        setOpportunities(await res.json());
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleManifestInterest = async (oppId) => {
    setManifesting(true);
    // Simulates api dispatch
    setTimeout(() => {
      showToast('Manifestação registrada! A mesa de captação da WHITECLUB entrará em contato.', 'success');
      setManifesting(false);
      setSelectedOpp(null);
    }, 1200);
  };

  return (
    <div className="opportunities-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">CO-INVESTIMENTO EXCLUSIVO</span>
        <h1>Oportunidades de Investimento</h1>
        <p className="subtitle">Mesa de private equity imobiliário, infraestrutura urbana e contechs ativas na WHITECLUB</p>
      </div>

      {/* Grid of opportunities */}
      <section className="opportunities-grid">
        {loading ? (
          <div className="loader-box"><div className="premium-loader"></div></div>
        ) : opportunities.length === 0 ? (
          <div className="glass-panel empty-box">Nenhuma oportunidade de co-investimento cadastrada no momento.</div>
        ) : (
          opportunities.map(opp => (
            <div key={opp.id} className="opportunity-card glass-panel glass-panel-hover fade-in">
              <div className="opp-cover">
                <img src={opp.image_url} alt={opp.title} />
                <span className="opp-status-badge">{opp.status}</span>
                {opp.badge && <span className="opp-tag-badge">{opp.badge}</span>}
              </div>

              <div className="opp-body">
                <span className="category-label">{opp.category_label || opp.category}</span>
                <h2>{opp.title}</h2>
                <p className="opp-short-desc">{opp.description}</p>

                {/* Financial details panel */}
                <div className="financials-panel">
                  <div className="fin-metric">
                    <TrendingUp size={16} className="text-gold" />
                    <div>
                      <span className="metric-lbl">Target IRR</span>
                      <span className="metric-val text-gold">{opp.target_irr}</span>
                    </div>
                  </div>
                  
                  <div className="fin-metric">
                    <DollarSign size={16} />
                    <div>
                      <span className="metric-lbl">Aporte Mínimo</span>
                      <span className="metric-val">{opp.min_investment}</span>
                    </div>
                  </div>
                </div>

                <div className="opp-footer">
                  <button onClick={() => setSelectedOpp(opp)} className="btn-gold details-btn">
                    Analisar Pitch Book
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Pitch book Modal */}
      {selectedOpp && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card pitch-modal fade-in">
            <button className="close-btn" onClick={() => setSelectedOpp(null)}>✕</button>
            
            <div className="pitch-header">
              <span className="welcome-tag">{selectedOpp.category_label}</span>
              <h2>{selectedOpp.title}</h2>
              <div className="modal-pills">
                <span className="pill">Métrica Alvo: {selectedOpp.target_irr}</span>
                <span className="pill">Aporte: {selectedOpp.min_investment}</span>
                <span className="pill status">{selectedOpp.status}</span>
              </div>
            </div>

            <div className="pitch-body">
              <div className="pitch-desc-section">
                <h3>Descrição e Tese de Negócios</h3>
                <p>{selectedOpp.long_description || selectedOpp.description}</p>
              </div>

              <div className="guarantees-section">
                <h3>Garantias Estruturais</h3>
                <ul>
                  <li><ShieldCheck size={14} className="text-gold" /> Patrimônio de Afetação instituído em cartório.</li>
                  <li><ShieldCheck size={14} className="text-gold" /> Estrutura SPE blindada com conselho fiscal ativo.</li>
                  <li><ShieldCheck size={14} className="text-gold" /> Alienação fiduciária e garantia real de frações de terreno.</li>
                </ul>
              </div>

              <div className="financial-sheet">
                <h3>Simulação de Retorno</h3>
                <div className="sim-table">
                  <div className="sim-row"><span>Investimento Exemplo</span><strong>R$ 100.000</strong></div>
                  <div className="sim-row"><span>Prazo Estimado</span><strong>24 meses</strong></div>
                  <div className="sim-row"><span>Retorno Final Projetado</span><strong className="text-gold">R$ 153.200 (VGV)</strong></div>
                </div>
              </div>
            </div>

            <div className="pitch-footer">
              <button 
                onClick={() => handleManifestInterest(selectedOpp.id)} 
                className="btn-gold manifest-btn"
                disabled={manifesting}
              >
                {manifesting ? 'Registrando Manifestação...' : 'Quero Co-Investir (Falar com Assessor)'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .opportunities-wrapper {
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

        .opportunities-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        @media (min-width: 768px) {
          .opportunities-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 1200px) {
          .opportunities-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .opportunity-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-color: var(--gold-border);
          height: 100%;
        }
        .opp-cover {
          height: 200px;
          position: relative;
        }
        .opp-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .opp-status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(1,1,5,0.8);
          border: 1px solid var(--gold-border);
          color: var(--gold);
          font-size: 10px;
          font-weight: bold;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .opp-tag-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--gold-gradient);
          color: #010105;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .opp-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .category-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .opp-body h2 {
          font-size: 18px;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .opp-short-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 20px;
          flex: 1;
        }

        .financials-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-light);
          padding: 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
        }
        .fin-metric {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-secondary);
        }
        .metric-lbl {
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
        }
        .metric-val {
          font-size: 13px;
          font-weight: 700;
        }

        .opp-footer {
          border-top: 1px solid var(--border-light);
          padding-top: 16px;
        }
        .details-btn {
          width: 100%;
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg-overlay);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .pitch-modal {
          max-width: 680px;
          width: 100%;
          padding: 40px;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 20px;
          cursor: pointer;
        }
        .pitch-header {
          margin-bottom: 25px;
        }
        .pitch-header h2 {
          font-size: 24px;
          margin-top: 6px;
          margin-bottom: 12px;
        }
        .modal-pills {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .modal-pills .pill {
          background: var(--bg-deep);
          border: 1px solid var(--border-light);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .modal-pills .pill.status {
          border-color: var(--gold-border);
          color: var(--gold);
          font-weight: 600;
        }

        .pitch-body {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 30px;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 10px;
        }
        .pitch-body h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .pitch-body p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        
        .guarantees-section ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .guarantees-section li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .sim-table {
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          padding: 16px;
        }
        .sim-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-light);
        }
        .sim-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .sim-row:first-child {
          padding-top: 0;
        }
        .sim-row span {
          color: var(--text-secondary);
        }

        .pitch-footer {
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }
        .manifest-btn {
          width: 100%;
        }

        .empty-box {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
        .loader-box { display: flex; align-items: center; justify-content: center; height: 200px; width: 100%; }
        .premium-loader { width: 35px; height: 35px; border: 2px solid rgba(46, 98, 246, 0.15); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

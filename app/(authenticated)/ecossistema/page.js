'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { ChevronLeft, ChevronRight, Play, ExternalLink, Info, Award, Mic } from 'lucide-react';
import Link from 'next/link';

export default function EcosystemPage() {
  const { user, showToast } = useAuth();
  
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/db?collection=banners');
      if (res.ok) {
        const data = await res.json();
        
        // PRD 7.6: "Banners com status desativado (disabled = true) não devem ser retornados na listagem pública"
        const visible = data
          .filter(b => !b.disabled)
          .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
        
        setBanners(visible);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleNextSlide = () => {
    if (banners.length === 0) return;
    setActiveSlide(prev => (prev + 1) % banners.length);
  };

  const handlePrevSlide = () => {
    if (banners.length === 0) return;
    setActiveSlide(prev => (prev - 1 + banners.length) % banners.length);
  };

  const mockPodcasts = [
    { id: 'pod-1', title: 'Episódio #42 - O Futuro do Alto Padrão nos Jardins', guest: 'Dr. Carlos Lima', duration: '45 min' },
    { id: 'pod-2', title: 'Episódio #41 - Captação Bancária e Fundos de Investimentos', guest: 'Bruno Ferreira (Mesa Crédito)', duration: '52 min' },
    { id: 'pod-3', title: 'Episódio #40 - Estruturas Metálicas Vencedoras de Vão', guest: 'Eng. Marcos Silva', duration: '38 min' }
  ];

  return (
    <div className="ecosystem-wrapper">
      <div className="title-section fade-in">
        <span className="welcome-tag">ECOSSISTEMA CLS</span>
        <h1>Ecossistema & Destaques</h1>
        <p className="subtitle">Lançamentos imobiliários, episódios de podcast de elite e ferramentas civis integradas</p>
      </div>

      {/* Interactive Highlights Banner Carousel */}
      <section className="carousel-section fade-in">
        {loading ? (
          <div className="loader-box glass-panel"><div className="premium-loader"></div></div>
        ) : banners.length === 0 ? (
          <div className="glass-panel empty-box">Nenhum banner ativo no ecossistema.</div>
        ) : (
          <div className="carousel-container glass-panel">
            {/* Active banner slide background */}
            <div 
              className="carousel-slide" 
              style={{ backgroundImage: `linear-gradient(rgba(1, 1, 5, 0.45), rgba(1, 1, 5, 0.85)), url(${banners[activeSlide].image})` }}
            >
              <div className="slide-content">
                <span className="slide-tag">{banners[activeSlide].tag}</span>
                <h2>{banners[activeSlide].title}</h2>
                {banners[activeSlide].subtitle && <h3>{banners[activeSlide].subtitle}</h3>}
                <p>{banners[activeSlide].description}</p>
                
                <Link href={banners[activeSlide].cta_link} className="btn-gold cta-btn">
                  {banners[activeSlide].cta_text} <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* Carousel navigation controls */}
            {banners.length > 1 && (
              <>
                <button onClick={handlePrevSlide} className="nav-btn prev" title="Anterior">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextSlide} className="nav-btn next" title="Próximo">
                  <ChevronRight size={20} />
                </button>
                
                {/* Carousel dots indicator */}
                <div className="carousel-dots">
                  {banners.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveSlide(idx)}
                      className={`dot-btn ${activeSlide === idx ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Double Column Features showcase */}
      <div className="dashboard-grid">
        {/* Left Column: Digital Products and Podcasts */}
        <div className="grid-col-left">
          {/* Podcasts */}
          <section className="glass-panel podcast-section fade-in">
            <div className="section-title-row">
              <Mic size={20} className="text-gold" />
              <h2>Podcast WHITECLUB Talks</h2>
            </div>
            <p className="section-desc">Entrevistas e bate-papos práticos semanais gravados diretamente no escritório corporativo.</p>

            <div className="podcast-list">
              {mockPodcasts.map(pod => (
                <div key={pod.id} className="podcast-row glass-panel-hover">
                  <div className="play-mic-bubble">
                    <Mic size={14} />
                  </div>
                  <div className="pod-meta">
                    <h4>{pod.title}</h4>
                    <span>Convidado: <strong>{pod.guest}</strong> • {pod.duration}</span>
                  </div>
                  <button onClick={() => showToast(`Iniciando player de áudio do episódio: ${pod.title}`, 'info')} className="btn-outline btn-listen-mini">
                    <Play size={10} fill="currentColor" /> Ouvir
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Co-investment opportunities shortcut */}
        <div className="grid-col-right">
          <section className="glass-panel active-pools-card fade-in">
            <h2>Pools de Co-Investimento</h2>
            <p className="pools-desc">Participe como investidor estratégico em captações ativas.</p>

            <div className="pool-shortcut-card">
              <Award className="text-gold" size={32} />
              <h4>Residencial Splendor - Jardins</h4>
              <p>Target IRR de 24.5% a.a. Mapeamento SPE imobiliário consolidado.</p>
              
              {user.member_type === 'admin' ? (
                <Link href="/oportunidades" className="btn-gold pool-link-btn">
                  Analisar Oportunidade
                </Link>
              ) : (
                <button 
                  onClick={() => showToast('Disponível em portais de co-investimento. Fale com um administrador.', 'info')} 
                  className="btn-outline pool-link-btn"
                >
                  Entrar em Contato
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .ecosystem-wrapper {
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

        .carousel-section {
          width: 100%;
        }
        .carousel-container {
          position: relative;
          height: 380px;
          border-color: var(--gold-border);
          overflow: hidden;
        }
        .carousel-slide {
          height: 100%;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: flex-end;
          padding: 50px;
        }
        .slide-content {
          max-width: 600px;
        }
        .slide-tag {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          color: #FFFFFF;
          background: var(--gold-gradient);
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 12px;
          letter-spacing: 0.05em;
        }
        .slide-content h2 {
          font-size: 28px;
          margin-bottom: 4px;
          letter-spacing: 0.02em;
          color: #FFFFFF;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .slide-content h3 {
          font-size: 16px;
          color: #FFFFFF;
          opacity: 0.95;
          margin-bottom: 10px;
          font-weight: 550;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slide-content p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
          margin-bottom: 20px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: rgba(1, 1, 5, 0.6);
          border: 1px solid var(--border-light);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .nav-btn:hover {
          color: var(--gold);
          border-color: var(--gold-border);
          background: rgba(1, 1, 5, 0.8);
        }
        .nav-btn.prev { left: 20px; }
        .nav-btn.next { right: 20px; }

        .carousel-dots {
          position: absolute;
          bottom: 20px;
          right: 30px;
          display: flex;
          gap: 8px;
        }
        .dot-btn {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          border: none;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .dot-btn.active {
          background: var(--gold);
          width: 24px;
          border-radius: 4px;
        }

        .podcast-section, .active-pools-card {
          padding: 24px;
        }
        .section-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .section-title-row h2 {
          font-size: 18px;
        }
        .section-desc {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .podcast-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .podcast-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
        }
        .play-mic-bubble {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(46, 98, 246, 0.08);
          color: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pod-meta {
          flex: 1;
        }
        .pod-meta h4 {
          font-size: 13px;
        }
        .pod-meta span {
          font-size: 11px;
          color: var(--text-muted);
        }
        .btn-listen-mini {
          padding: 6px 12px;
          font-size: 11px;
        }

        .pools-desc {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        .pool-shortcut-card {
          border: 1px solid var(--border-light);
          background: var(--bg-card);
          border-radius: var(--radius-md);
          padding: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .pool-shortcut-card h4 {
          font-size: 15px;
          margin-top: 8px;
        }
        .pool-shortcut-card p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .pool-link-btn {
          width: 100%;
        }

        .empty-box {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
        .loader-box { display: flex; align-items: center; justify-content: center; height: 380px; width: 100%; }
        .premium-loader { width: 35px; height: 35px; border: 2px solid rgba(46, 98, 246, 0.15); border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

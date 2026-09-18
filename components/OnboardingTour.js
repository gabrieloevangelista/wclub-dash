'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

export default function OnboardingTour() {
  const [activeStep, setActiveStep] = useState(-1); // -1 means check storage first
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [skipForever, setSkipForever] = useState(false);
  const tooltipRef = useRef(null);

  const steps = [
    {
      target: '#tour-welcome',
      title: '👋 Boas-vindas Personalizada',
      content: 'Aqui você recebe saudações dinâmicas adaptadas ao fuso horário, exibindo seu primeiro nome e cargo corporativo.'
    },
    {
      target: '#tour-progress',
      title: '📊 Indicadores de Progresso',
      content: 'Acompanhe a sua evolução na mentoria. Veja a barra de progresso das aulas assistidas e o status de suas missões técnicas.'
    },
    {
      target: '#tour-posts',
      title: '📣 Comunidade e Feed',
      content: 'Participe do ecossistema postando fotos, stories expirados de 24h (Status) ou vídeos rápidos (Reels).'
    },
    {
      target: '#tour-events',
      title: '📅 Agenda de Eventos',
      content: 'Fique por dentro das datas de Mentorias Coletivas e Reuniões de Atualização de Obras. Sincronize com seu Google Agenda!'
    },
    {
      target: '#tour-courses',
      title: '🎓 Atalho de Masterclasses',
      content: 'Inicie ou retome as aulas das suas Masterclasses ativas. Todo conteúdo premium de engenharia e finanças está aqui.'
    },
    {
      target: '#tour-nav',
      title: '🧭 Barra de Navegação',
      content: 'Use o menu lateral ou a barra inferior para navegar entre o Feed, Calendário, Recursos, Conexões e Missões.'
    }
  ];

  // Initialize and check localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const skip = localStorage.getItem('cls_skip_tutorial');
      if (skip !== 'true') {
        setActiveStep(0);
      }
      
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Update target element coordinate mapping
  useEffect(() => {
    if (activeStep < 0 || activeStep >= steps.length) return;

    const getCoords = () => {
      const step = steps[activeStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        // Add scroll offsets
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
        
        // Scroll target into view gently
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback to center screen if element is not rendered on active route
        setCoords({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 150,
          width: 0,
          height: 0
        });
      }
    };

    // Delay slightly to let page render
    const timer = setTimeout(getCoords, 300);
    return () => clearTimeout(timer);
  }, [activeStep, windowSize]);

  if (activeStep === -1 || activeStep >= steps.length) return null;

  const current = steps[activeStep];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleComplete();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (skipForever) {
      localStorage.setItem('cls_skip_tutorial', 'true');
    }
    setActiveStep(steps.length); // close
  };

  const handleSkip = () => {
    localStorage.setItem('cls_skip_tutorial', 'true');
    setActiveStep(steps.length); // close
  };

  // Determine tooltip card placement based on coordinates
  const isCentered = coords.width === 0;
  const tooltipStyle = isCentered 
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000
      }
    : {
        position: 'absolute',
        top: coords.top + coords.height + 15 + 'px',
        left: Math.max(10, Math.min(windowSize.width - 340, coords.left + coords.width / 2 - 160)) + 'px',
        zIndex: 10000
      };

  return (
    <div className="tour-overlay">
      {/* Target Focus Border Highlight */}
      {!isCentered && (
        <div 
          className="tour-focus-ring" 
          style={{
            top: coords.top - 8 + 'px',
            left: coords.left - 8 + 'px',
            width: coords.width + 16 + 'px',
            height: coords.height + 16 + 'px'
          }}
        />
      )}

      {/* Tooltip Card */}
      <div ref={tooltipRef} className="glass-panel tour-tooltip" style={tooltipStyle}>
        <button className="tour-close" onClick={handleSkip}>
          <X size={16} />
        </button>

        <div className="tour-content">
          <span className="step-indicator">Etapa {activeStep + 1} de {steps.length}</span>
          <h3>{current.title}</h3>
          <p>{current.content}</p>
        </div>

        <div className="tour-footer">
          <label className="skip-checkbox">
            <input 
              type="checkbox" 
              checked={skipForever}
              onChange={(e) => setSkipForever(e.target.checked)}
            />
            <span>Não mostrar novamente</span>
          </label>

          <div className="tour-buttons">
            {activeStep > 0 && (
              <button onClick={handlePrev} className="btn-tour-nav">
                <ChevronLeft size={16} />
              </button>
            )}
            <button onClick={handleNext} className="btn-gold btn-tour-next">
              {activeStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
              {activeStep < steps.length - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tour-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          min-height: 100vh;
          background: rgba(1, 1, 5, 0.45);
          pointer-events: auto;
          z-index: 9998;
        }
        .tour-focus-ring {
          position: absolute;
          border: 2px solid var(--gold);
          border-radius: 8px;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.45);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .tour-tooltip {
          width: 320px;
          padding: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 15px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .tour-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .tour-close:hover {
          color: var(--text-primary);
        }
        .step-indicator {
          font-size: 10px;
          font-weight: 700;
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tour-content h3 {
          font-size: 16px;
          margin: 6px 0 10px 0;
          color: var(--text-primary);
        }
        .tour-content p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .tour-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-light);
          padding-top: 12px;
          gap: 10px;
        }
        .skip-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .skip-checkbox input {
          accent-color: var(--gold);
        }
        .skip-checkbox span {
          font-size: 10px;
          color: var(--text-muted);
        }
        .tour-buttons {
          display: flex;
          gap: 6px;
        }
        .btn-tour-nav {
          background: var(--bg-deep);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .btn-tour-nav:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }
        .btn-tour-next {
          padding: 0 12px;
          height: 32px;
          font-size: 12px;
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}

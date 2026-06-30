'use client';

import React from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { useRouter } from 'next/navigation';

export default function SemPermissaoPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="permission-wrapper">
      <div className="glass-panel alert-card fade-in">
        <div className="alert-header">
          <div className="alert-icon">⚠</div>
          <h1>ACESSO NEGADO</h1>
        </div>

        {user?.status === 'Inativo' ? (
          <div className="alert-body">
            <p>Olá, <strong>{user?.name}</strong>.</p>
            <p>Sua conta no portal <strong>WHITECLUB</strong> está atualmente marcada como <strong>Inativa</strong>.</p>
            <p className="subtext">Para reativar seu acesso e usufruir da mentoria, entre em contato com nossa equipe administrativa.</p>
          </div>
        ) : (
          <div className="alert-body">
            <p>Olá, <strong>{user?.name}</strong>.</p>
            <p>Você tentou acessar uma rota ou painel restrito a administradores do sistema.</p>
            <p className="subtext">Caso considere isso um erro, verifique suas credenciais de acesso ou entre em contato com o suporte.</p>
          </div>
        )}

        <div className="alert-actions">
          <button onClick={() => router.push('/dashboard')} className="btn-outline">
            Voltar ao Início
          </button>
          <button onClick={handleLogout} className="btn-danger">
            Sair da Conta
          </button>
        </div>
      </div>

      <style jsx>{`
        .permission-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-deep);
          padding: 20px;
        }
        .alert-card {
          width: 100%;
          max-width: 500px;
          padding: 40px;
          border-color: rgba(239, 68, 68, 0.3);
          text-align: center;
        }
        .alert-header {
          margin-bottom: 25px;
        }
        .alert-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 15px;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        h1 {
          font-size: 24px;
          color: #EF4444;
          letter-spacing: 0.05em;
        }
        .alert-body {
          margin-bottom: 30px;
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 15px;
        }
        .alert-body p {
          margin-bottom: 12px;
        }
        .subtext {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 15px;
        }
        .alert-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

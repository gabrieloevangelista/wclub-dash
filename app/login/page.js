'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456'); // Default seed password for easy login
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredMsg = searchParams.get('registered');
  const errorMsg = searchParams.get('error');

  // If already logged in and active, auto redirect to dashboard
  useEffect(() => {
    if (user && user.status === 'Ativo') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  // Quick helper to fill in fields for testing
  const selectQuickAccount = (quickEmail) => {
    setEmail(quickEmail);
    setPassword('123456');
  };

  return (
    <div className="login-wrapper">
      <div className="glass-panel login-card fade-in">
        <div className="brand-section">
          <div className="brand-badge">CLS</div>
          <h1 className="brand-title">WHITE<span className="text-gold">CLUB</span></h1>
          <p className="brand-subtitle">Portal de Elite & Comunidade Premium</p>
        </div>

        {registeredMsg && (
          <div className="alert-success">
            ✓ Cadastro realizado com sucesso! Faça login abaixo.
          </div>
        )}

        {errorMsg && (
          <div className="alert-error">
            {errorMsg === 'suspended' ? '⚠ O cadastro público está desativado. Entre em contato.' : errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="premium-label">E-mail corporativo</label>
            <input 
              type="email" 
              className="premium-input" 
              placeholder="seu.nome@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="premium-label">Senha de acesso</label>
            <input 
              type="password" 
              className="premium-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-gold login-btn" disabled={submitting}>
            {submitting ? 'Acessando...' : 'Entrar no Portal'}
          </button>
        </form>

        <div className="divider">
          <span>Acesso rápido para testes</span>
        </div>

        <div className="demo-accounts">
          <button 
            type="button" 
            className="demo-badge admin-badge"
            onClick={() => selectQuickAccount('admin@whiteclub.com')}
          >
            <strong>Admin:</strong> Carlos Lima
          </button>
          <button 
            type="button" 
            className="demo-badge master-badge"
            onClick={() => selectQuickAccount('master@whiteclub.com')}
          >
            <strong>Master/Mentor:</strong> Marcos Silva
          </button>
          <button 
            type="button" 
            className="demo-badge mentor-badge"
            onClick={() => selectQuickAccount('mentor@whiteclub.com')}
          >
            <strong>Mentor/Membro:</strong> Ana Costa
          </button>
          <button 
            type="button" 
            className="demo-badge inactive-badge"
            onClick={() => selectQuickAccount('inactive@whiteclub.com')}
          >
            <strong>Inativo:</strong> Felipe Melo
          </button>
        </div>
      </div>

      <style jsx>{`
        .login-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-deep);
          padding: 20px;
        }
        .login-card {
          width: 100%;
          max-width: 460px;
          padding: 40px;
          border-color: var(--border-light);
          background: var(--bg-card);
        }
        .brand-section {
          text-align: center;
          margin-bottom: 30px;
        }
        .brand-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #FFFFFF;
          background: var(--gold-gradient);
          padding: 4px 10px;
          border-radius: 30px;
          margin-bottom: 12px;
          letter-spacing: 0.1em;
        }
        .brand-title {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .brand-subtitle {
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 400;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .login-btn {
          width: 100%;
          margin-top: 10px;
        }
        .divider {
          text-align: center;
          margin: 25px 0 15px 0;
          border-bottom: 1px solid var(--border-light);
          line-height: 0.1em;
        }
        .divider span {
          background: var(--bg-card);
          padding: 0 10px;
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .demo-accounts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .demo-badge {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          padding: 10px;
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .demo-badge:hover {
          background: var(--gold-glow);
          border-color: var(--gold-border);
          color: var(--gold);
        }
        .demo-badge strong {
          color: var(--text-primary);
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10B981;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #EF4444;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}

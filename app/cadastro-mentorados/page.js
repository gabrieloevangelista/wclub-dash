'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/ClientWrapper';

export default function CadastroMentoradosPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { setUser, showToast } = useAuth();
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register-mentorado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erro ao registrar conta.');
        setSubmitting(false);
        return;
      }

      showToast('Conta criada com sucesso!', 'success');

      // Auto-Login: simulates logging in by saving the new user profile in local storage
      localStorage.setItem('wclub_session', JSON.stringify(data.user));
      setUser(data.user);
      
      showToast(`Bem-vindo, ${data.user.name}!`, 'success');
      router.push('/dashboard');
    } catch (err) {
      setError('Erro de rede ou servidor.');
      setSubmitting(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="glass-panel register-card fade-in">
        <div className="brand-section">
          <div className="brand-badge">CONVITE EXCLUSIVO</div>
          <h1 className="brand-title">WHITE<span className="text-gold">CLUB</span></h1>
          <p className="brand-subtitle">Preencha os dados abaixo para ativar sua mentoria</p>
        </div>

        {error && (
          <div className="alert-error">
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="register-form">
          <div className="input-group">
            <label className="premium-label">Nome Completo</label>
            <input 
              type="text" 
              className="premium-input" 
              placeholder="Ex: Ana Costa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="premium-label">E-mail corporativo</label>
            <input 
              type="email" 
              className="premium-input" 
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="premium-label">Senha (min. 6 dígitos)</label>
            <input 
              type="password" 
              className="premium-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="premium-label">Confirmar Senha</label>
            <input 
              type="password" 
              className="premium-input" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-gold register-btn" disabled={submitting}>
            {submitting ? 'Ativando Cadastro...' : 'Ativar Minha Mentoria'}
          </button>
        </form>

        <div className="footer-links">
          <a href="/login" className="back-link">Já tem uma conta? Entrar</a>
        </div>
      </div>

      <style jsx>{`
        .register-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-deep);
          padding: 20px;
        }
        .register-card {
          width: 100%;
          max-width: 480px;
          padding: 40px;
          border-color: var(--border-light);
          background: var(--bg-card);
        }
        .brand-section {
          text-align: center;
          margin-bottom: 25px;
        }
        .brand-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          color: #FFFFFF;
          background: var(--gold-gradient);
          padding: 4px 12px;
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
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .register-btn {
          width: 100%;
          margin-top: 10px;
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #EF4444;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 18px;
        }
        .footer-links {
          margin-top: 20px;
          text-align: center;
        }
        .back-link {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .back-link:hover {
          color: var(--gold);
        }
      `}</style>
    </div>
  );
}

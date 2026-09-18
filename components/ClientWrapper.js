'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export function ClientWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const router = useRouter();
  const pathname = usePathname();

  // Load user session on start
  useEffect(() => {
    const savedUser = localStorage.getItem('wclub_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('wclub_session');
      }
    }
    setLoading(false);
  }, []);

  // Show dynamic toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Route security gate (guards active status and admin controls)
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/login', '/cadastro', '/cadastro-mentorados', '/sem-permissao'];
    const isPublic = publicRoutes.includes(pathname);

    if (!user) {
      if (!isPublic && pathname !== '/') {
        showToast('Faça login para acessar esta página.', 'warning');
        router.push('/login');
      }
      return;
    }

    // Controle de Inatividade e Bloqueios
    if (user.status !== 'Ativo' && pathname !== '/sem-permissao') {
      router.push('/sem-permissao');
      return;
    }

    // Restrição de rotas administrativas e especiais
    const adminRoutes = ['/oportunidades', '/projetos', '/admin'];
    const isRestrictedRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isRestrictedRoute && user.member_type !== 'admin') {
      router.push('/sem-permissao');
      showToast('Acesso restrito exclusivamente a administradores.', 'error');
    }
  }, [user, pathname, loading]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // 1. Fetch members from API to authenticate
      const res = await fetch('/api/db?collection=members');
      const members = await res.json();
      
      const matched = members.find(m => m.email.toLowerCase() === email.toLowerCase());
      
      if (!matched) {
        showToast('E-mail não cadastrado.', 'error');
        setLoading(false);
        return false;
      }

      // Simple mock password verification (mock environment accepts any password for default seeded accounts, except inactive which gets blocked)
      if (password.length < 4) {
        showToast('A senha deve ter no mínimo 4 caracteres.', 'error');
        setLoading(false);
        return false;
      }

      localStorage.setItem('wclub_session', JSON.stringify(matched));
      setUser(matched);
      showToast(`Bem-vindo, ${matched.name}!`, 'success');
      
      if (matched.status === 'Ativo') {
        router.push('/dashboard');
      } else {
        router.push('/sem-permissao');
      }
      
      setLoading(false);
      return true;
    } catch (err) {
      showToast('Erro ao realizar login.', 'error');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('wclub_session');
    setUser(null);
    showToast('Sessão encerrada com sucesso.', 'info');
    router.push('/login');
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          collection: 'members',
          id: user.id,
          updates
        })
      });
      if (res.ok) {
        const updated = await res.json();
        localStorage.setItem('wclub_session', JSON.stringify(updated));
        setUser(updated);
        showToast('Perfil atualizado com sucesso!', 'success');
        return true;
      }
    } catch (e) {
      showToast('Falha ao salvar as alterações.', 'error');
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, updateProfile, showToast }}>
      {children}
      
      {/* Premium Toast Notification Portal */}
      <div className="toast-portal">
        {toasts.map(t => (
          <div key={t.id} className={`toast-card toast-${t.type} fade-in`}>
            <div className="toast-icon">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'warning' && '⚠'}
              {t.type === 'info' && 'i'}
            </div>
            <div className="toast-content">{t.message}</div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .toast-portal {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 9999;
          pointer-events: none;
        }
        .toast-card {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          backdrop-filter: blur(12px);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          box-shadow: var(--shadow-premium);
          min-width: 280px;
          max-width: 400px;
        }
        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-weight: bold;
          font-size: 12px;
        }
        .toast-success { border-color: rgba(16, 185, 129, 0.4); }
        .toast-success .toast-icon { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        
        .toast-error { border-color: rgba(239, 68, 68, 0.4); }
        .toast-error .toast-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        
        .toast-warning { border-color: rgba(245, 158, 11, 0.4); }
        .toast-warning .toast-icon { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        
        .toast-info { border-color: var(--gold-border); }
        .toast-info .toast-icon { background: rgba(46, 98, 246, 0.12); color: var(--gold); }
      `}</style>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

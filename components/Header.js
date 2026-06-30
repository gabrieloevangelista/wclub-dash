'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ClientWrapper';
import { Bell, User, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { user, showToast } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Fetch notifications
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/db?collection=notifications');
        if (res.ok) {
          const data = await res.json();
          // Filter: user_id is null (global) or matches current user
          const filtered = data.filter(n => n.user_id === null || n.user_id === user.id);
          // Sort cronologically
          filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setNotifications(filtered);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };

    fetchNotifs();
    
    // Poll every 30 seconds for simulation of live portal notifications
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          collection: 'notifications',
          id,
          updates: { is_read: true }
        })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        showToast('Notificação lida.', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    
    try {
      await Promise.all(unread.map(n => 
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            collection: 'notifications',
            id: n.id,
            updates: { is_read: true }
          })
        })
      ));
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('Todas as notificações foram marcadas como lidas.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <header className="main-header">
      <div className="header-greeting">
        {/* Empty or helper text */}
      </div>

      <div className="header-actions">
        {/* Notification Bell */}
        <div className="notification-wrapper">
          <button className="icon-btn" onClick={() => setOpenDropdown(!openDropdown)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {openDropdown && (
            <div className="glass-panel notification-dropdown fade-in">
              <div className="dropdown-header">
                <h3>Notificações</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="mark-all-btn">
                    Marcar todas
                  </button>
                )}
              </div>

              <div className="dropdown-list">
                {notifications.length === 0 ? (
                  <div className="empty-notif">Nenhuma notificação por aqui.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.is_read ? 'read' : 'unread'}`}>
                      <div className="notif-body">
                        <h4>{n.title}</h4>
                        <p>{n.description}</p>
                        <span className="notif-time">
                          {new Date(n.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="notif-actions">
                        {!n.is_read && (
                          <button onClick={() => markAsRead(n.id)} className="read-btn" title="Marcar como lida">
                            <Check size={14} />
                          </button>
                        )}
                        {n.link && (
                          <Link href={n.link} onClick={() => setOpenDropdown(false)} className="link-btn" title="Verificar link">
                            <ExternalLink size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <Link href="/conexoes" className="user-profile-card">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role || 'Membro do Club'}</span>
          </div>
          <div className="avatar-bubble">
            {user.img ? (
              <img src={user.img} alt={user.name} />
            ) : (
              <span>{user.initials || 'WC'}</span>
            )}
          </div>
        </Link>
      </div>

      <style jsx>{`
        .main-header {
          height: 80px;
          border-bottom: 1px solid var(--border-light);
          background: var(--bg-card);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 980;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.01);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-left: auto;
        }
        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          position: relative;
          padding: 8px;
          border-radius: 50%;
          transition: var(--transition-smooth);
        }
        .icon-btn:hover {
          color: var(--gold);
          background: var(--bg-deep);
        }
        .badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: var(--gold);
          color: #FFFFFF;
          font-size: 9px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notification-wrapper {
          position: relative;
        }
        .notification-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          width: 360px;
          max-height: 480px;
          display: flex;
          flex-direction: column;
          border-color: var(--gold-border);
          overflow: hidden;
          background: var(--bg-card);
        }
        .dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
        }
        .dropdown-header h3 {
          font-size: 16px;
        }
        .mark-all-btn {
          background: transparent;
          border: none;
          color: var(--gold);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .dropdown-list {
          overflow-y: auto;
          flex: 1;
        }
        .empty-notif {
          padding: 30px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
        .notif-item {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          transition: var(--transition-smooth);
        }
        .notif-item.unread {
          background: var(--gold-glow);
          border-left: 2px solid var(--gold);
        }
        .notif-item.read {
          opacity: 0.7;
        }
        .notif-body h4 {
          font-size: 13px;
          margin-bottom: 4px;
        }
        .notif-body p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 6px;
        }
        .notif-time {
          font-size: 10px;
          color: var(--text-muted);
        }
        .notif-actions {
          display: flex;
          gap: 6px;
        }
        .read-btn, .link-btn {
          background: var(--bg-deep);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          width: 26px;
          height: 26px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .read-btn:hover {
          color: #10B981;
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.1);
        }
        .link-btn:hover {
          color: var(--gold);
          border-color: var(--gold-border);
          background: rgba(46, 98, 246, 0.08);
        }
        :global(.user-profile-card) {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-decoration: none;
        }
        .user-info {
          text-align: right;
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.25;
        }
        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .user-role {
          font-size: 10px;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .avatar-bubble {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--gold-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 14px;
          border: 1px solid var(--gold-border);
          overflow: hidden;
        }
        .avatar-bubble img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        @media (max-width: 768px) {
          .main-header {
            padding: 0 20px;
          }
          .user-info {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

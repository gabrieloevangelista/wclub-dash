'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/ClientWrapper';
import { 
  LayoutDashboard, PlayCircle, Calendar, Users, CheckSquare, 
  Globe, Shield, Building, Calculator, ChevronLeft, ChevronRight, LogOut,
  Compass
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setCollapsed(false);
      }
    };
    
    // Initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'master', 'mentor'] },
    { name: 'Feed da Comunidade', path: '/feed', icon: Compass, roles: ['admin', 'master', 'mentor'] },
    { name: 'Masterclasses', path: '/masterclasses', icon: PlayCircle, roles: ['admin', 'master', 'mentor'] },
    { name: 'Calendário', path: '/agenda', icon: Calendar, roles: ['admin', 'master', 'mentor'] },
    { name: 'Conexões', path: '/conexoes', icon: Users, roles: ['admin', 'master', 'mentor'] },
    { name: 'Missões', path: '/missoes', icon: CheckSquare, roles: ['admin', 'master', 'mentor'] },
    { name: 'Ecossistema', path: '/ecossistema', icon: Globe, roles: ['admin', 'master', 'mentor'] },
  ];

  // Admin exclusive pages (PRD 3: "Acesso exclusivo às páginas de Oportunidades de Investimento e Projetos para Financiamento")
  const adminPages = [
    { name: 'Oportunidades', path: '/oportunidades', icon: Building },
  ];

  // Admin controls
  const adminControls = [
    { name: 'Gestão Conteúdo', path: '/admin/conteudo', icon: PlayCircle },
    { name: 'Gestão Membros', path: '/admin/membros', icon: Users },
    { name: 'Banners Ecossistema', path: '/admin/ecossistema', icon: Globe },
    { name: 'Correções Missões', path: '/admin/missoes', icon: CheckSquare },
  ];

  if (!user) return null;

  // Render bottom bar for Mobile
  if (isMobile) {
    const mobileItems = menuItems.filter(item => item.roles.includes(user.member_type));
    // If admin, we can add a shortcut or swap an item to let them open special page
    return (
      <div className="bottom-nav">
        {mobileItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
        {user.member_type === 'admin' && (
          <Link href="/oportunidades" className={`bottom-nav-item ${pathname.startsWith('/oportunidades') ? 'active' : ''}`}>
            <Building size={20} />
            <span>Oportunidades</span>
          </Link>
        )}
        <button onClick={logout} className="bottom-nav-item logout-btn">
          <LogOut size={20} />
          <span>Sair</span>
        </button>

        <style jsx>{`
          .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 64px;
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border-top: 1px solid var(--border-light);
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: 1000;
            padding-bottom: env(safe-area-inset-bottom);
            box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.03);
          }
          :global(.bottom-nav-item) {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 10px;
            flex: 1;
            height: 100%;
            background: transparent;
            border: none;
            cursor: pointer;
          }
          :global(.bottom-nav-item.active) {
            color: var(--gold);
          }
          .logout-btn {
            color: #ff6b6b;
          }
        `}</style>
      </div>
    );
  }

  // Render Sidebar for Desktop / Tablet
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        {!collapsed ? (
          <h2>WHITE<span className="text-gold">CLUB</span></h2>
        ) : (
          <h2 className="text-gold">W</h2>
        )}
      </div>

      <div className="sidebar-scroll">
        <div className="menu-group">
          <span className="group-title">{collapsed ? '•' : 'Menu Principal'}</span>
          {menuItems
            .filter(item => item.roles.includes(user.member_type))
            .map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path} className={`menu-link ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
        </div>

        {user.member_type === 'admin' && (
          <>
            <div className="menu-group">
              <span className="group-title">{collapsed ? '•' : 'Especiais Admin'}</span>
              {adminPages.map(item => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.path);
                return (
                  <Link key={item.path} href={item.path} className={`menu-link ${isActive ? 'active' : ''}`}>
                    <Icon size={18} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            <div className="menu-group">
              <span className="group-title">{collapsed ? '•' : 'Controles Administrativos'}</span>
              {adminControls.map(item => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.path);
                return (
                  <Link key={item.path} href={item.path} className={`menu-link ${isActive ? 'active' : ''}`}>
                    <Icon size={18} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-button">
          <LogOut size={18} />
          {!collapsed && <span>Sair da Conta</span>}
        </button>
        {windowWidth >= 1024 && (
          <button onClick={() => setCollapsed(!collapsed)} className="collapse-toggle">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <style jsx>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background: var(--bg-card);
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          transition: var(--transition-smooth);
          z-index: 999;
          box-shadow: 4px 0 12px rgba(15, 23, 42, 0.02);
        }
        .sidebar.collapsed {
          width: 80px;
        }
        .sidebar-logo {
          height: 80px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          border-bottom: 1px solid var(--border-light);
        }
        .sidebar-logo h2 {
          font-size: 20px;
          letter-spacing: 0.1em;
          white-space: nowrap;
          color: var(--text-primary);
        }
        .sidebar-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px 12px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .menu-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .group-title {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0 12px 8px 12px;
        }
        :global(.menu-link) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition-smooth);
        }
        :global(.menu-link:hover) {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }
        :global(.menu-link.active) {
          background: var(--gold-glow);
          color: var(--gold);
          border-left: 2px solid var(--gold);
        }
        .sidebar-footer {
          border-top: 1px solid var(--border-light);
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .logout-button {
          background: transparent;
          border: none;
          color: #ff6b6b;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: 14px;
          border-radius: var(--radius-sm);
          flex: 1;
          text-align: left;
        }
        .logout-button:hover {
          background: rgba(255, 107, 107, 0.08);
        }
        .collapse-toggle {
          background: var(--bg-card-hover);
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
        .collapse-toggle:hover {
          color: var(--gold);
          border-color: var(--gold-border);
        }
      `}</style>
    </div>
  );
}

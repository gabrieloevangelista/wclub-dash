'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';
import { useAuth } from '@/components/ClientWrapper';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-container">
        <div className="premium-loader"></div>
        <style jsx>{`
          .loader-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: var(--bg-deep);
          }
          .premium-loader {
            width: 40px;
            height: 40px;
            border: 2px solid rgba(46, 98, 246, 0.1);
            border-top-color: var(--gold);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="layout-container">
      <Navigation />
      
      <div className="layout-content">
        <Header />
        <main className="content-viewport">
          {children}
        </main>
      </div>

      <style jsx>{`
        .layout-container {
          display: flex;
          min-height: 100vh;
          background: var(--bg-deep);
        }
        .layout-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          overflow-x: hidden;
          margin-left: 260px;
          transition: margin-left var(--transition-smooth, 0.3s ease);
        }
        .content-viewport {
          flex: 1;
          padding: 40px;
          overflow-y: auto;
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .layout-content {
            margin-left: 80px;
          }
        }
        @media (max-width: 767px) {
          .layout-container {
            flex-direction: column;
          }
          .layout-content {
            margin-left: 0;
          }
          .content-viewport {
            padding: 20px;
            padding-bottom: 90px; /* Safe padding for BottomTabBar touch comfort */
          }
        }
      `}</style>
    </div>
  );
}

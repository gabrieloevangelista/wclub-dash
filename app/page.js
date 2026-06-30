'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/ClientWrapper';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="loader-container">
      <div className="premium-loader"></div>
      <div className="loader-text">Carregando WHITECLUB...</div>

      <style jsx>{`
        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: var(--bg-deep);
        }
        .premium-loader {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(46, 98, 246, 0.1);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loader-text {
          margin-top: 20px;
          color: var(--text-secondary);
          font-family: var(--font-title);
          letter-spacing: 0.05em;
          font-size: 14px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

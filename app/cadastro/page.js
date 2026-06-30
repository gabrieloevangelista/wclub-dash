'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona imediatamente para /login com aviso de suspensão
    router.replace('/login?error=suspended');
  }, [router]);

  return (
    <div style={{ background: 'var(--bg-deep)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      Redirecionando...
    </div>
  );
}

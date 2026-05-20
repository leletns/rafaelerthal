'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/safe-storage';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F5F7',
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #007AFF, #0051D5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              animation: 'pulse 1s infinite',
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>b.</span>
          </div>
          <p style={{ color: '#86868B', fontSize: '0.875rem' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

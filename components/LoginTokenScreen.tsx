'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '@/lib/safe-storage';

interface LoginTokenScreenProps {
  onSuccess?: () => void;
}

export default function LoginTokenScreen({ onSuccess }: LoginTokenScreenProps) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) {
      setError('Informe o token de acesso.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (res.ok) {
        setAuthToken(token.trim());
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/dashboard');
        }
      } else {
        setError('Token inválido. Tente novamente.');
        setToken('');
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A2540 0%, #1A3A5C 40%, #0D47A1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Montserrat', sans-serif",
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '24px',
          padding: '3rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #007AFF, #0051D5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 24px rgba(0,122,255,0.35)',
          }}
        >
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-2px' }}>b.</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1D1D1F', marginBottom: '0.25rem' }}>
          Clínica Blue
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#86868B', marginBottom: '2rem' }}>
          Dashboard interno — Dr. Rafael Erthal
        </p>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#86868B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Token de acesso
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `2px solid ${error ? '#FF3B30' : '#E5E5EA'}`,
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
                background: '#F9F9FB',
              }}
            />
          </div>
          {error && (
            <div style={{ background: '#FFE5E3', color: '#FF3B30', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              background: loading ? '#99C9FF' : 'linear-gradient(135deg, #007AFF, #0051D5)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(0,122,255,0.3)',
            }}
          >
            {loading ? 'Entrando...' : 'Acessar Dashboard'}
          </button>
        </form>
        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#C7C7CC' }}>
          Acesso restrito — uso interno
        </p>
      </div>
    </div>
  );
}

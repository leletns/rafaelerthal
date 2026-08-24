'use client';

import { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken, isAuthenticated } from '@/lib/safe-storage';

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fieldId = useId();
  const errorId = `${fieldId}-erro`;

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) {
      setError('Digite a senha de acesso.');
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
        router.replace('/dashboard');
      } else {
        setError('Senha incorreta. Tente novamente.');
        setToken('');
      }
    } catch {
      setError('Não foi possível conectar. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '44px 40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            aria-hidden="true"
            style={{
              fontSize: '56px',
              fontWeight: 200,
              color: 'var(--brand)',
              letterSpacing: '-4px',
              lineHeight: 1,
              marginBottom: '18px',
            }}
          >
            b.
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-.4px' }}>
            Clínica Blue
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: '6px' }}>
            Painel de gestão · Dr. Rafael Erthal
          </p>
        </div>

        <form onSubmit={handleLogin} noValidate>
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label htmlFor={fieldId} className="field-lbl">
              Senha de acesso
            </label>
            <input
              id={fieldId}
              type="password"
              autoComplete="current-password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '13px 16px',
                fontSize: '16px',
                borderColor: error ? 'var(--c-red)' : 'var(--border)',
              }}
            />
          </div>

          {error && (
            <p
              id={errorId}
              role="alert"
              style={{
                background: 'var(--tint-red)',
                color: 'var(--c-red)',
                borderRadius: '10px',
                padding: '11px 14px',
                fontSize: '13.5px',
                marginBottom: '16px',
                fontWeight: 600,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p style={{ marginTop: '28px', fontSize: '12.5px', color: 'var(--text-3)', textAlign: 'center' }}>
          Acesso restrito à equipe da clínica
        </p>
      </div>
    </main>
  );
}

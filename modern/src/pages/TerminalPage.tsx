import React from 'react';
import { Dashboard } from '../terminal';
import { useAuth } from '../hooks/useAuth';

export const TerminalPage: React.FC = () => {
  const { user, loading: authLoading, login } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <header style={{
        background: '#111', color: '#fff', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>
          Buffett Playbook — Terminal
        </div>
        <nav style={{ display: 'flex', gap: 16, fontSize: 13, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/dashboard" style={{ color: '#fff', textDecoration: 'none', opacity: 0.7 }}>Dashboard</a>
          <a href="/terminal" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Terminal</a>
          <a href="/screener" style={{ color: '#fff', textDecoration: 'none', opacity: 0.7 }}>Screener</a>
          <a href="/stock-details" style={{ color: '#fff', textDecoration: 'none', opacity: 0.7 }}>Research</a>
          {authLoading ? (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Checking auth…</span>
          ) : user ? (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{user.name}</span>
          ) : (
            <button
              onClick={() => login('/terminal')}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 4,
                border: '1px solid #fff', background: 'transparent', color: '#fff',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
          )}
        </nav>
      </header>

      {/* Auth banner if not logged in */}
      {!authLoading && !user && (
        <div style={{
          background: '#eff6ff', borderBottom: '1px solid #bfdbfe',
          padding: '10px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: '#1e40af' }}>
            You're viewing demo data. Login for full access.
          </span>
          <button
            onClick={() => login('/terminal')}
            style={{
              fontSize: 12, padding: '5px 14px', borderRadius: 4,
              border: 'none', background: '#2563eb', color: '#fff',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            Login with Patreon
          </button>
        </div>
      )}

      <Dashboard />
    </div>
  );
};

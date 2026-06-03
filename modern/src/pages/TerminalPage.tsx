import React from 'react';
import { Dashboard } from '../terminal';

export const TerminalPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{
        background: '#111', color: '#fff', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>
          Buffett Playbook — Terminal
        </div>
        <nav style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <a href="/dashboard" style={{ color: '#fff', textDecoration: 'none', opacity: 0.7 }}>Dashboard</a>
          <a href="/terminal" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Terminal</a>
          <a href="/screener" style={{ color: '#fff', textDecoration: 'none', opacity: 0.7 }}>Screener</a>
          <a href="/stock-details" style={{ color: '#fff', textDecoration: 'none', opacity: 0.7 }}>Research</a>
        </nav>
      </header>
      <Dashboard />
    </div>
  );
};

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, CheckCircle2 } from 'lucide-react';

const StoresPlaceholder = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}
      >
        <Store size={36} />
      </div>

      <div className="brand-badge" style={{ marginBottom: '1rem' }}>
        <CheckCircle2 size={14} /> Normal User Session Active
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Welcome, {user?.name}!</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto 2rem auto' }}>
        You have successfully logged in as a <strong>Normal User</strong>. Authentication, token management, and route protections are fully active.
      </p>

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          textAlign: 'left',
          maxWidth: 480,
          margin: '0 auto',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>User Session Details:</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div><strong>Role:</strong> {user?.role}</div>
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Address:</strong> {user?.address}</div>
        </div>
      </div>
    </div>
  );
};

export default StoresPlaceholder;

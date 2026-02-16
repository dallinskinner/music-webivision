'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import './AuthButton.css';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="auth-btn-wrap">
        <span className="auth-loading">...</span>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="auth-btn-wrap">
        <span className="auth-user">
          <span className="auth-bracket">[</span>
          {session.user.name?.toUpperCase() ?? 'USER'}
          <span className="auth-bracket">]</span>
        </span>
        <button className="auth-btn auth-disconnect" onClick={() => signOut()}>
          DISCONNECT
        </button>
      </div>
    );
  }

  return (
    <div className="auth-btn-wrap">
      <button className="auth-btn auth-connect" onClick={() => signIn('google')}>
        <span className="auth-bracket">[</span>
        CONNECT
        <span className="auth-bracket">]</span>
      </button>
    </div>
  );
}

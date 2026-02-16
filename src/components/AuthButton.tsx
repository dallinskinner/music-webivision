'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import styles from './AuthButton.module.css';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={styles.authBtnWrap}>
        <span className={styles.authLoading}>...</span>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className={styles.authBtnWrap}>
        <span className={styles.authUser}>
          <span className={styles.authBracket}>[</span>
          {session.user.name?.toUpperCase() ?? 'USER'}
          <span className={styles.authBracket}>]</span>
        </span>
        <button className={`${styles.authBtn} ${styles.authDisconnect}`} onClick={() => signOut()}>
          DISCONNECT
        </button>
      </div>
    );
  }

  return (
    <div className={styles.authBtnWrap}>
      <button className={styles.authBtn} onClick={() => signIn('google')}>
        <span className={styles.authBracket}>[</span>
        CONNECT
        <span className={styles.authBracket}>]</span>
      </button>
    </div>
  );
}

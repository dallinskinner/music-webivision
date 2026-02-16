import NextAuth from 'next-auth';
import { findUserByGoogleId, createUser, updateUser } from './db';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google' || !profile?.sub || !profile.email) {
        return false;
      }

      const existing = findUserByGoogleId(profile.sub);
      if (existing) {
        updateUser(existing.id, {
          email: profile.email,
          name: (profile.name as string) ?? null,
          image: (profile.picture as string) ?? null,
        });
      } else {
        createUser({
          google_id: profile.sub,
          email: profile.email,
          name: (profile.name as string) ?? null,
          image: (profile.picture as string) ?? null,
        });
      }

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile?.sub) {
        const user = findUserByGoogleId(profile.sub);
        if (user) {
          token.userId = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});

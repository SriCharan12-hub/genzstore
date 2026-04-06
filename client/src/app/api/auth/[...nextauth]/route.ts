import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
const ADMIN_EMAIL = 'sricharanpalem07@gmail.com';

interface CustomUser {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
  avatar?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              token: data.token,
            } as CustomUser;
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const res = await fetch(`${API_URL}/api/auth/google/google-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatar: user.image,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            (user as CustomUser).role = data.user.role;
            (user as CustomUser).token = data.token;
          } else {
            console.warn('Backend sync failed, allowing Google login with defaults');
            (user as CustomUser).role = user.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
            (user as CustomUser).token = '';
          }
        } catch (error) {
          console.error('Google Sync Error (non-blocking):', error);
          (user as CustomUser).role = user.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
          (user as CustomUser).token = '';
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as unknown as CustomUser;
        token.role = customUser.role;
        token.accessToken = customUser.token;
        token.email = customUser.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).user.role = token.role;
        (session as any).user.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

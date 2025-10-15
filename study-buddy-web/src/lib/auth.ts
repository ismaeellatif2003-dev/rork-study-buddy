import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Send user data to backend for authentication
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idToken: account.id_token,
              platform: 'web',
              deviceInfo: {
                sessionId: 'web-session-' + Date.now(),
                platform: 'web',
                userAgent: 'web-client',
                screenResolution: 'unknown',
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Store backend token in session
            user.backendToken = data.token;
            user.backendUser = data.user;
            return true;
          }
        } catch (error) {
          console.error('Backend authentication failed:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.backendToken) {
        token.backendToken = user.backendToken;
        token.backendUser = user.backendUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.backendToken) {
        session.backendToken = token.backendToken as string;
        session.backendUser = token.backendUser as {
          id: string;
          email: string;
          name: string;
          picture?: string;
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    backendToken?: string;
    backendUser?: {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };
  }

  interface User {
    backendToken?: string;
    backendUser?: {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string;
    backendUser?: {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };
  }
}

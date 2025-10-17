'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface Subscription {
  plan: {
    id: string;
    name: string;
    price: number;
    yearlyPrice?: number;
    billingPeriod: string;
    limits: Record<string, number>;
    features: string[];
  };
  isActive: boolean;
  expiresAt?: string;
  usage: {
    notes: number;
    flashcards: number;
    messages: number;
    essays: number;
    ocrScans: number;
  };
}

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  refreshSubscription: () => Promise<void>;
  updateUsage: (type: string, increment?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session?.backendToken;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 AuthContext - Session status:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasBackendToken: !!session?.backendToken,
      hasBackendUser: !!session?.backendUser,
      isAuthenticated,
      status
    });
  }, [session, isAuthenticated, status]);

  // Set up axios interceptor for authenticated requests
  useEffect(() => {
    if (session?.backendToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${session.backendToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [session?.backendToken]);

  // Load user data and subscription when session changes
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.backendToken && session?.backendUser) {
        setUser(session.backendUser);
        await refreshSubscription();
      } else {
        setUser(null);
        setSubscription(null);
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [session]);

  const refreshSubscription = async () => {
    if (!session?.backendToken) return;

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/subscription-status`);
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const updateUsage = async (type: string, increment: number = 1) => {
    if (!session?.backendToken) return;

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/usage/update`, {
        type,
        increment,
      });
      await refreshSubscription();
    } catch (error) {
      console.error('Failed to update usage:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear backend token from axios
      delete axios.defaults.headers.common['Authorization'];
      
      // Sign out from NextAuth
      await signOut({ callbackUrl: '/' });
      
      // Clear local state
      setUser(null);
      setSubscription(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    subscription,
    isLoading: isLoading || status === 'loading',
    isAuthenticated,
    signOut: handleSignOut,
    refreshSubscription,
    updateUsage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

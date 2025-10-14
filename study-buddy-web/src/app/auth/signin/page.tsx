'use client';

import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to Study Buddy
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Access your study materials across all devices
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <GoogleSignIn 
            text="Continue with Google"
            className="w-full bg-blue-600 text-white hover:bg-blue-700 border-0 font-medium py-3 px-4 rounded-lg shadow-sm transition-colors"
            onSuccess={() => router.push('/')}
            onError={(error) => console.error('Sign in error:', error)}
          />
          
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

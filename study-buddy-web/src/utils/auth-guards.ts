import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export interface AuthGuardOptions {
  requireAuth?: boolean;
  requirePro?: boolean;
  redirectTo?: string;
  showUpgradePrompt?: boolean;
}

export const useAuthGuard = (options: AuthGuardOptions = {}) => {
  const { 
    requireAuth = true, 
    requirePro = false, 
    redirectTo = '/auth/signin',
    showUpgradePrompt = true 
  } = options;

  const { data: session } = useSession();
  const { subscription, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check Pro requirement
    if (requirePro && subscription && !isProUser(subscription)) {
      if (showUpgradePrompt) {
        // Show upgrade prompt instead of redirecting
        return;
      } else {
        router.push('/subscription');
        return;
      }
    }
  }, [isAuthenticated, subscription, isLoading, requireAuth, requirePro, redirectTo, router, showUpgradePrompt]);

  const isProUser = (sub: typeof subscription) => {
    return sub?.plan?.id === 'pro-monthly' || sub?.plan?.id === 'pro-yearly';
  };

  const isAuthenticatedUser = isAuthenticated;
  const isPro = subscription ? isProUser(subscription) : false;
  const canAccess = requireAuth ? isAuthenticatedUser : true;
  const canAccessPro = requirePro ? isPro : true;

  return {
    isAuthenticated: isAuthenticatedUser,
    isPro,
    canAccess,
    canAccessPro,
    isLoading,
    subscription
  };
};

export const useFeatureGuard = (featureType: string) => {
  const { subscription, isAuthenticated } = useAuth();
  
  const canUseFeature = (type: string): boolean => {
    if (!isAuthenticated || !subscription) return false;
    
    const isPro = subscription.plan.id === 'pro-monthly' || subscription.plan.id === 'pro-yearly';
    
    // Pro users have unlimited access to all features
    if (isPro) return true;
    
    // Free users have limited access
    const limit = subscription.plan.limits[type as keyof typeof subscription.plan.limits];
    const usage = subscription.usage[type as keyof typeof subscription.usage];
    
    // -1 means unlimited
    if (limit === -1) return true;
    
    return usage < limit;
  };

  const getRemainingUsage = (type: string): number => {
    if (!subscription) return 0;
    
    const limit = subscription.plan.limits[type as keyof typeof subscription.plan.limits];
    const usage = subscription.usage[type as keyof typeof subscription.usage];
    
    // -1 means unlimited
    if (limit === -1) return -1;
    
    return Math.max(0, limit - usage);
  };

  const isProFeature = (type: string): boolean => {
    // Video AI is Pro-only
    if (type === 'videoAnalysis') return true;
    
    // Other features are available to free users with limits
    return false;
  };

  return {
    canUseFeature: canUseFeature(featureType),
    getRemainingUsage: getRemainingUsage(featureType),
    isProFeature: isProFeature(featureType),
    isPro: subscription ? (subscription.plan.id === 'pro-monthly' || subscription.plan.id === 'pro-yearly') : false,
    isAuthenticated
  };
};

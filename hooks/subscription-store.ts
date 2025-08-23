import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import type { SubscriptionPlan, UserSubscription, UsageStats } from '@/types/study';

const STORAGE_KEYS = {
  SUBSCRIPTION: 'study_buddy_subscription',
  USAGE_STATS: 'study_buddy_usage_stats',
};

// Subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'monthly',
    features: [
      '5 notes per month',
      '25 flashcards per month',
      '10 AI questions per day',
      'Basic summaries'
    ],
    maxNotes: 5,
    maxFlashcards: 25,
    aiQuestionsPerDay: 10,
    cameraScanning: false,
    aiEnhancedCards: false,
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: 9.99,
    interval: 'monthly',
    features: [
      'Unlimited notes',
      'Unlimited flashcards',
      'Unlimited AI questions',
      'Camera note scanning',
      'AI-enhanced flashcards',
      'Priority support'
    ],
    maxNotes: -1, // -1 means unlimited
    maxFlashcards: -1,
    aiQuestionsPerDay: -1,
    cameraScanning: true,
    aiEnhancedCards: true,
  },
  {
    id: 'pro_yearly',
    name: 'Pro (Yearly)',
    price: 99.99,
    interval: 'yearly',
    features: [
      'Unlimited notes',
      'Unlimited flashcards',
      'Unlimited AI questions',
      'Camera note scanning',
      'AI-enhanced flashcards',
      'Priority support',
      '2 months free!'
    ],
    maxNotes: -1,
    maxFlashcards: -1,
    aiQuestionsPerDay: -1,
    cameraScanning: true,
    aiEnhancedCards: true,
  },
];

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    notesCreated: 0,
    flashcardsGenerated: 0,
    aiQuestionsAsked: 0,
    lastResetDate: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load subscription data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subscriptionData, usageData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
          AsyncStorage.getItem(STORAGE_KEYS.USAGE_STATS),
        ]);

        if (subscriptionData) {
          const parsed = JSON.parse(subscriptionData);
          setSubscription({
            ...parsed,
            startDate: new Date(parsed.startDate),
            endDate: new Date(parsed.endDate),
          });
        }

        if (usageData) {
          const parsed = JSON.parse(usageData);
          setUsageStats({
            ...parsed,
            lastResetDate: new Date(parsed.lastResetDate),
          });
        }
      } catch (error) {
        console.error('Error loading subscription data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Reset usage stats if needed (daily for AI questions, monthly for notes/flashcards)
  useEffect(() => {
    const checkAndResetUsage = async () => {
      const now = new Date();
      const lastReset = usageStats.lastResetDate;
      
      // Reset daily AI questions
      if (now.getDate() !== lastReset.getDate() || 
          now.getMonth() !== lastReset.getMonth() || 
          now.getFullYear() !== lastReset.getFullYear()) {
        
        const newStats = {
          ...usageStats,
          aiQuestionsAsked: 0,
          lastResetDate: now,
        };

        // Reset monthly limits on first day of month
        if (now.getDate() === 1 && (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear())) {
          newStats.notesCreated = 0;
          newStats.flashcardsGenerated = 0;
        }

        setUsageStats(newStats);
        await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
      }
    };

    if (!isLoading) {
      checkAndResetUsage();
    }
  }, [usageStats, isLoading]);

  // Get current plan
  const getCurrentPlan = useCallback((): SubscriptionPlan => {
    if (!subscription || subscription.status !== 'active' || new Date() > subscription.endDate) {
      return SUBSCRIPTION_PLANS[0]; // Free plan
    }
    return SUBSCRIPTION_PLANS.find(plan => plan.id === subscription.planId) || SUBSCRIPTION_PLANS[0];
  }, [subscription]);

  // Check if user can perform action
  const canCreateNote = useCallback((): boolean => {
    const plan = getCurrentPlan();
    return plan.maxNotes === -1 || usageStats.notesCreated < plan.maxNotes;
  }, [getCurrentPlan, usageStats.notesCreated]);

  const canGenerateFlashcards = useCallback((count: number): boolean => {
    const plan = getCurrentPlan();
    return plan.maxFlashcards === -1 || (usageStats.flashcardsGenerated + count) <= plan.maxFlashcards;
  }, [getCurrentPlan, usageStats.flashcardsGenerated]);

  const canAskAIQuestion = useCallback((): boolean => {
    const plan = getCurrentPlan();
    return plan.aiQuestionsPerDay === -1 || usageStats.aiQuestionsAsked < plan.aiQuestionsPerDay;
  }, [getCurrentPlan, usageStats.aiQuestionsAsked]);

  const canUseCameraScanning = useCallback((): boolean => {
    const plan = getCurrentPlan();
    return plan.cameraScanning;
  }, [getCurrentPlan]);

  const canUseAIEnhancedCards = useCallback((): boolean => {
    const plan = getCurrentPlan();
    return plan.aiEnhancedCards;
  }, [getCurrentPlan]);

  // Track usage
  const trackNoteCreation = useCallback(async () => {
    const newStats = {
      ...usageStats,
      notesCreated: usageStats.notesCreated + 1,
    };
    setUsageStats(newStats);
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
  }, [usageStats]);

  const trackFlashcardGeneration = useCallback(async (count: number) => {
    const newStats = {
      ...usageStats,
      flashcardsGenerated: usageStats.flashcardsGenerated + count,
    };
    setUsageStats(newStats);
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
  }, [usageStats]);

  const trackAIQuestion = useCallback(async () => {
    const newStats = {
      ...usageStats,
      aiQuestionsAsked: usageStats.aiQuestionsAsked + 1,
    };
    setUsageStats(newStats);
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
  }, [usageStats]);

  // Subscribe to plan (mock implementation)
  const subscribeToPlan = useCallback(async (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || plan.id === 'free') return;

    const startDate = new Date();
    const endDate = new Date();
    if (plan.interval === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const newSubscription: UserSubscription = {
      planId,
      status: 'active',
      startDate,
      endDate,
      autoRenew: true,
    };

    setSubscription(newSubscription);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(newSubscription));
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (subscription) {
      const updatedSubscription = {
        ...subscription,
        autoRenew: false,
        status: 'cancelled' as const,
      };
      setSubscription(updatedSubscription);
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(updatedSubscription));
    }
  }, [subscription]);

  return {
    subscription,
    usageStats,
    isLoading,
    getCurrentPlan,
    canCreateNote,
    canGenerateFlashcards,
    canAskAIQuestion,
    canUseCameraScanning,
    canUseAIEnhancedCards,
    trackNoteCreation,
    trackFlashcardGeneration,
    trackAIQuestion,
    subscribeToPlan,
    cancelSubscription,
  };
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import type { SubscriptionPlan, UserSubscription, UsageStats } from '@/types/study';

const STORAGE_KEYS = {
  SUBSCRIPTION: 'study_buddy_subscription',
  USAGE_STATS: 'study_buddy_usage_stats',
};

// Product IDs for App Store and Google Play
// These should match your configured products in App Store Connect and Google Play Console
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'app.rork.study_buddy_4fpqfs7.subscription.monthly',
  PRO_YEARLY: 'app.rork.study_buddy_4fpqfs7.subscription.yearly'
};

// Subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'monthly',
    productId: null,
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
    productId: PRODUCT_IDS.PRO_MONTHLY,
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
    productId: PRODUCT_IDS.PRO_YEARLY,
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // Load subscription data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subscriptionData, usageData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
          AsyncStorage.getItem(STORAGE_KEYS.USAGE_STATS),
        ]);

        if (subscriptionData) {
          try {
            const parsed = JSON.parse(subscriptionData);
            if (parsed && typeof parsed === 'object' && parsed.planId) {
              setSubscription({
                ...parsed,
                startDate: new Date(parsed.startDate),
                endDate: new Date(parsed.endDate),
              });
            } else {
              console.warn('Invalid subscription data structure, resetting');
              await AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION);
            }
          } catch (parseError) {
            console.error('Error parsing subscription data:', parseError);
            await AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION);
          }
        }

        if (usageData) {
          try {
            const parsed = JSON.parse(usageData);
            if (parsed && typeof parsed === 'object' && typeof parsed.notesCreated === 'number') {
              setUsageStats({
                ...parsed,
                lastResetDate: new Date(parsed.lastResetDate),
              });
            } else {
              console.warn('Invalid usage stats data structure, resetting');
              await AsyncStorage.removeItem(STORAGE_KEYS.USAGE_STATS);
            }
          } catch (parseError) {
            console.error('Error parsing usage stats data:', parseError);
            await AsyncStorage.removeItem(STORAGE_KEYS.USAGE_STATS);
          }
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

  // Initialize in-app purchases (for when you move to custom build)
  const initializeIAP = useCallback(async () => {
    try {
      // This is where you'd initialize react-native-iap
      // For now, we'll simulate available products
      console.log('IAP initialized (simulated)');
      
      // In real implementation:
      // await RNIap.initConnection();
      // const products = await RNIap.getSubscriptions([PRODUCT_IDS.PRO_MONTHLY, PRODUCT_IDS.PRO_YEARLY]);
      // setAvailableProducts(products);
      
      // Simulated products for demo
      setAvailableProducts([
        { productId: PRODUCT_IDS.PRO_MONTHLY, price: '$9.99', currency: 'USD' },
        { productId: PRODUCT_IDS.PRO_YEARLY, price: '$99.99', currency: 'USD' }
      ]);
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
    }
  }, []);

  // Mock subscribe for demo (remove when implementing real payments)
  const mockSubscribe = useCallback(async (planId: string) => {
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

  // Subscribe to plan with real payment processing
  const subscribeToPlan = useCallback(async (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || plan.id === 'free' || !plan.productId) return;

    setIsProcessingPayment(true);
    
    try {
      if (Platform.OS === 'web') {
        // For web, redirect to Stripe or other web payment processor
        Alert.alert(
          'Web Payment',
          'Web payments would redirect to Stripe checkout. This is a demo.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Demo Subscribe', onPress: () => mockSubscribe(planId) }
          ]
        );
        return;
      }

      // For mobile platforms, use in-app purchases
      // In real implementation with react-native-iap:
      /*
      const purchase = await RNIap.requestSubscription({
        sku: plan.productId,
        ...(Platform.OS === 'android' && {
          subscriptionOffers: [{
            sku: plan.productId,
            offerToken: 'your_offer_token'
          }]
        })
      });
      
      // Verify purchase with your backend
      const verificationResult = await trpcClient.subscription.verifyPurchase.mutate({
        platform: Platform.OS,
        purchaseToken: purchase.purchaseToken,
        productId: purchase.productId,
        transactionId: purchase.transactionId
      });
      
      if (verificationResult.success) {
        // Update local subscription state
        setSubscription(verificationResult.subscription);
        await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(verificationResult.subscription));
      }
      */
      
      // For demo purposes, show alert and mock subscribe
      Alert.alert(
        'Purchase Subscription',
        `This would process payment for ${plan.name} (${plan.productId}) via ${Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}. This is a demo.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Demo Purchase', onPress: () => mockSubscribe(planId) }
        ]
      );
      
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [mockSubscribe]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!subscription) return;
    
    try {
      // In real implementation, cancel with the platform
      // For iOS: No action needed, just disable auto-renew in your backend
      // For Android: Use Google Play Developer API to cancel
      
      // Cancel with your backend
      // await trpcClient.subscription.cancel.mutate({ subscriptionId: subscription.id });
      
      const updatedSubscription = {
        ...subscription,
        autoRenew: false,
        status: 'cancelled' as const,
      };
      setSubscription(updatedSubscription);
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(updatedSubscription));
      
      Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled. You will retain access until the end of your billing period.');
    } catch (error) {
      console.error('Cancel subscription error:', error);
      Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
    }
  }, [subscription]);

  // Restore purchases (important for iOS)
  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // In real implementation:
      /*
      const purchases = await RNIap.getAvailablePurchases();
      
      for (const purchase of purchases) {
        // Verify each purchase with your backend
        const verificationResult = await trpcClient.subscription.verifyPurchase.mutate({
          platform: Platform.OS,
          purchaseToken: purchase.purchaseToken,
          productId: purchase.productId,
          transactionId: purchase.transactionId
        });
        
        if (verificationResult.success && verificationResult.subscription) {
          setSubscription(verificationResult.subscription);
          await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(verificationResult.subscription));
          break; // Use the most recent active subscription
        }
      }
      */
      
      Alert.alert('Restore Purchases', 'This would restore your previous purchases. Demo only.');
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize IAP on mount
  useEffect(() => {
    initializeIAP();
  }, [initializeIAP]);

  return useMemo(() => ({
    subscription,
    usageStats,
    isLoading,
    isProcessingPayment,
    availableProducts,
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
    restorePurchases,
    initializeIAP,
  }), [subscription, usageStats, isLoading, isProcessingPayment, availableProducts, getCurrentPlan, canCreateNote, canGenerateFlashcards, canAskAIQuestion, canUseCameraScanning, canUseAIEnhancedCards, trackNoteCreation, trackFlashcardGeneration, trackAIQuestion, subscribeToPlan, cancelSubscription, restorePurchases, initializeIAP]);
});
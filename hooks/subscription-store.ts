import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import type { SubscriptionPlan, UserSubscription, UsageStats } from '@/types/study';
import paymentService from '@/utils/payment-service';
import { googleAuthService } from '@/utils/google-auth';

const STORAGE_KEYS = {
  SUBSCRIPTION: 'study_buddy_subscription',
  USAGE_STATS: 'study_buddy_usage_stats',
};

// Product IDs for App Store and Google Play
export const PRODUCT_IDS = {
  PRO_MONTHLY: Platform.OS === 'ios' 
    ? 'app.rork.study_buddy_4fpqfs7.subscription.monthly123'
    : 'study_buddy_pro_monthly',
  PRO_YEARLY: Platform.OS === 'ios'
    ? 'app.rork.study_buddy_4fpqfs7.subscription.yearly123'
    : 'study_buddy_pro_yearly'
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
      '1 essay per month',
      'Basic summaries'
    ],
    maxNotes: 5,
    maxFlashcards: 25,
    aiQuestionsPerDay: 10,
    maxEssays: 1,
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
      'Unlimited essays',
      'Camera note scanning',
      'AI-enhanced flashcards',
      'Priority support'
    ],
    maxNotes: -1, // -1 means unlimited
    maxFlashcards: -1,
    aiQuestionsPerDay: -1,
    maxEssays: -1,
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
      'Unlimited essays',
      'Camera note scanning',
      'AI-enhanced flashcards',
      'Priority support',
      '2 months free!'
    ],
    maxNotes: -1,
    maxFlashcards: -1,
    aiQuestionsPerDay: -1,
    maxEssays: -1,
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
    essaysGenerated: 0,
    lastResetDate: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isPaymentInitialized, setIsPaymentInitialized] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);

  // Load subscription data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subscriptionData, usageData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION),
          AsyncStorage.getItem(STORAGE_KEYS.USAGE_STATS),
        ]);

        // DEVELOPMENT/TESTING: Auto-set pro plan for testing
        const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
        if (isDevelopment && !subscriptionData) {
          console.log('🚀 DEVELOPMENT MODE: Setting up Pro plan for testing');
          const testProSubscription: UserSubscription = {
            planId: 'pro_monthly',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            productId: PRODUCT_IDS.PRO_MONTHLY,
            transactionId: 'test_transaction_' + Date.now(),
            originalTransactionId: 'test_original_' + Date.now(),
            isActive: true,
            isTrial: false,
            willRenew: true,
            autoRenewStatus: true,
            environment: 'sandbox',
            receiptData: 'test_receipt_data',
            latestReceiptInfo: null,
            pendingRenewalInfo: null,
          };
          
          await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(testProSubscription));
          setSubscription(testProSubscription);
          console.log('✅ Pro plan activated for testing');
        } else if (subscriptionData) {
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
          newStats.essaysGenerated = 0;
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
    console.log('getCurrentPlan called with subscription:', subscription);
    if (!subscription || subscription.status !== 'active' || new Date() > subscription.endDate) {
      console.log('Returning free plan because:', {
        noSubscription: !subscription,
        statusNotActive: subscription?.status !== 'active',
        expired: subscription ? new Date() > subscription.endDate : false,
        currentDate: new Date(),
        endDate: subscription?.endDate
      });
      return SUBSCRIPTION_PLANS[0]; // Free plan
    }
    const plan = SUBSCRIPTION_PLANS.find(plan => plan.id === subscription.planId) || SUBSCRIPTION_PLANS[0];
    console.log('Returning plan:', plan);
    return plan;
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

  const canGenerateEssay = useCallback((): boolean => {
    const plan = getCurrentPlan();
    return plan.maxEssays === -1 || usageStats.essaysGenerated < plan.maxEssays;
  }, [getCurrentPlan, usageStats.essaysGenerated]);

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

  const trackEssayGeneration = useCallback(async () => {
    const newStats = {
      ...usageStats,
      essaysGenerated: usageStats.essaysGenerated + 1,
    };
    setUsageStats(newStats);
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newStats));
  }, [usageStats]);

  // Initialize payment service (lazy initialization)
  const initializePayment = useCallback(async () => {
    // Only initialize if not already initialized
    if (isPaymentInitialized) {
      return true;
    }

    try {
      // Initialize payment service
      const success = await paymentService.initialize();
      setIsPaymentInitialized(success);
      
      if (success) {
        // Get available products
        const products = paymentService.getAvailableProducts();
        setAvailableProducts(products);
        
        // Set up payment service callbacks
        paymentService.onPurchaseSuccess = async (newSubscription) => {
          if (isUpdatingSubscription) {
            console.log('Subscription update already in progress, skipping...');
            return;
          }
          
          setIsUpdatingSubscription(true);
          console.log('Purchase success callback called with:', newSubscription);
          console.log('Setting subscription state...');
          setSubscription(newSubscription);
          console.log('Subscription state set, saving to storage...');
          await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(newSubscription));
          console.log('Subscription saved to storage');
          
          // No success alert - user will see the updated subscription status on the subscription tab
          console.log('Subscription activated successfully and saved to storage');
          setIsUpdatingSubscription(false);
        };
        
        paymentService.onPurchaseError = (error) => {
          console.error('Purchase error:', error);
          console.log('__DEV__ is:', __DEV__);
          console.log('Error includes Product ID mismatch:', error.includes('Product ID mismatch'));
          
          // Never show Product ID mismatch errors - they're always development issues
          if (error.includes('Product ID mismatch')) {
            console.log('Suppressing Product ID mismatch error - development issue');
            return;
          }
          
          // Only show alert for non-cancellation errors
          if (!error.includes('cancelled') && !error.includes('user cancelled')) {
            Alert.alert('Purchase Error', error);
          }
        };
        
        paymentService.onPurchaseCancelled = () => {
          // Purchase cancelled by user
        };
      }
      
      return success;
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
      // Only show alert in development mode, not in production
      if (__DEV__) {
        console.log('Payment service initialization failed - this is expected in development');
      }
      return false;
    }
  }, [isPaymentInitialized]);

  // Subscribe to plan with payment service
  const subscribeToPlan = useCallback(async (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || plan.id === 'free' || !plan.productId) return;

    setIsProcessingPayment(true);
    
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Mobile Only',
          'Subscriptions are only available on mobile devices. Please use the mobile app to subscribe.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Initialize payment service if not already initialized
      if (!isPaymentInitialized) {
        const initialized = await initializePayment();
        if (!initialized) {
          Alert.alert(
            'Payment Service Unavailable',
            'Payment service is not available on this device. Please try again later.',
            [{ text: 'OK', style: 'default' }]
          );
          return;
        }
      }

      const planKey = planId === 'pro_monthly' ? 'pro_monthly' : 'pro_yearly';
      await paymentService.purchaseSubscription(planKey);
      
    } catch (error) {
      console.error('Subscription error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('user cancelled')) {
          // User cancelled purchase - no alert needed
          console.log('Purchase cancelled by user');
        } else if (error.message.includes('not available')) {
          Alert.alert(
            'Product Not Available',
            'This subscription plan is not available in the store. Please try a different plan.',
            [{ text: 'OK', style: 'default' }]
          );
        } else if (error.message.includes('network')) {
          Alert.alert(
            'Network Error',
            'Please check your internet connection and try again.',
            [{ text: 'OK', style: 'default' }]
          );
        } else if (error.message.includes('not initialized')) {
          Alert.alert(
            'Payment Service Not Ready',
            'Please wait a moment and try again.',
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          Alert.alert(
            'Purchase Error',
            error.message || 'There was an issue processing your purchase. Please try again.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      } else {
        Alert.alert(
          'Purchase Error',
          'There was an issue processing your purchase. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } finally {
      setIsProcessingPayment(false);
    }
  }, [isPaymentInitialized]);

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

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web') {
        Alert.alert(
          'Mobile Only',
          'Purchase restoration is only available on mobile devices.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Initialize payment service if not already initialized
      if (!isPaymentInitialized) {
        const initialized = await initializePayment();
        if (!initialized) {
          Alert.alert(
            'Payment Service Unavailable',
            'Payment service is not available on this device. Please try again later.',
            [{ text: 'OK', style: 'default' }]
          );
          return;
        }
      }

      const restoredSubscriptions = await paymentService.restorePurchases();
      
      if (restoredSubscriptions.length === 0) {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Use the most recent active subscription
      const activeSubscription = restoredSubscriptions.find(sub => 
        sub.status === 'active' && new Date() <= sub.endDate
      );

      if (activeSubscription) {
        setSubscription(activeSubscription);
        await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(activeSubscription));
        
        Alert.alert(
          'Purchases Restored! 🎉',
          `Your ${activeSubscription.planId === 'pro_monthly' ? 'Pro Monthly' : 'Pro Yearly'} subscription has been restored.`,
          [{ text: 'Great!', style: 'default' }]
        );
      } else {
        Alert.alert(
          'No Active Subscriptions',
          'No active subscriptions were found to restore.',
          [{ text: 'OK', style: 'default' }]
        );
      }
      
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert(
        'Restore Error',
        'Failed to restore purchases. Please try again or contact support.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // DEVELOPMENT/TESTING: Manual pro plan activation
  const activateTestProPlan = useCallback(async () => {
    console.log('🚀 Manually activating Pro plan for testing');
    const testProSubscription: UserSubscription = {
      planId: 'pro_monthly',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      productId: PRODUCT_IDS.PRO_MONTHLY,
      transactionId: 'test_transaction_' + Date.now(),
      originalTransactionId: 'test_original_' + Date.now(),
      isActive: true,
      isTrial: false,
      willRenew: true,
      autoRenewStatus: true,
      environment: 'sandbox',
      receiptData: 'test_receipt_data',
      latestReceiptInfo: null,
      pendingRenewInfo: null,
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(testProSubscription));
    setSubscription(testProSubscription);
    console.log('✅ Pro plan manually activated for testing');
    Alert.alert('Pro Plan Activated', 'Pro plan is now active for testing!');
  }, []);

  // Backend sync functionality
  const syncWithBackend = useCallback(async () => {
    try {
      const isSignedIn = await googleAuthService.isSignedIn();
      if (!isSignedIn) {
        console.log('User not signed in, skipping backend sync');
        return;
      }

      console.log('🔄 Syncing subscription data with backend...');
      const syncData = await googleAuthService.syncData();
      
      if (syncData) {
        // Update subscription if backend has different data
        if (syncData.subscription) {
          const backendSubscription = syncData.subscription;
          const currentSubscription = subscription;
          
          // Don't downgrade from Pro to Free - only upgrade or sync same level
          const isCurrentPro = currentSubscription && currentSubscription.planId !== 'free';
          const isBackendPro = backendSubscription.planId !== 'free';
          
          // If backend subscription is different, update local (but don't downgrade)
          if (!currentSubscription || 
              (currentSubscription.planId !== backendSubscription.planId && 
               !(isCurrentPro && !isBackendPro)) || // Don't downgrade from Pro to Free
              currentSubscription.status !== backendSubscription.status) {
            console.log('📱 Updating subscription from backend:', backendSubscription);
            console.log('📱 Current Pro:', isCurrentPro, 'Backend Pro:', isBackendPro);
            setSubscription(backendSubscription);
            await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(backendSubscription));
          } else if (isCurrentPro && !isBackendPro) {
            console.log('🛡️ Preventing downgrade from Pro to Free - keeping local Pro plan');
          }
        }

        // Update usage stats if backend has different data
        if (syncData.usage) {
          const backendUsage = syncData.usage;
          const currentUsage = usageStats;
          
          // If backend usage is different, update local
          if (JSON.stringify(currentUsage) !== JSON.stringify(backendUsage)) {
            console.log('📱 Updating usage stats from backend:', backendUsage);
            setUsageStats(backendUsage);
            await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(backendUsage));
          }
        }
        
        console.log('✅ Backend sync completed');
      }
    } catch (error) {
      console.error('❌ Backend sync failed:', error);
    }
  }, [subscription, usageStats]);

  // Push local subscription to backend
  const pushSubscriptionToBackend = useCallback(async () => {
    try {
      const isSignedIn = await googleAuthService.isSignedIn();
      if (!isSignedIn) {
        console.log('User not signed in, skipping backend push');
        return;
      }

      if (!subscription || subscription.planId === 'free') {
        console.log('No Pro subscription to push to backend');
        return;
      }

      console.log('🔄 Pushing subscription to backend:', subscription);
      
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔑 Auth token found:', token ? 'YES' : 'NO');
      if (token) {
        console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      }
      
      if (!token) {
        console.log('❌ No auth token found, skipping backend push');
        return;
      }

      // Map the subscription to the format expected by the backend
      const planId = subscription.planId === 'pro_monthly' ? 'pro-monthly' : 'pro-yearly';
      const requestBody = {
        planId,
        billingPeriod: subscription.planId === 'pro_yearly' ? 'yearly' : 'monthly',
        expiresAt: subscription.endDate.toISOString(),
      };
      
      console.log('📤 Sending request to backend:', {
        url: 'https://rork-study-buddy-production-eeeb.up.railway.app/subscription/upgrade',
        method: 'POST',
        body: requestBody
      });
      
      const response = await fetch('https://rork-study-buddy-production-eeeb.up.railway.app/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Backend response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Subscription pushed to backend successfully:', responseData);
        // Don't sync back immediately to avoid overwriting local Pro plan
        console.log('📱 Subscription synced to backend - web should now show Pro plan');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to push subscription to backend:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      }
    } catch (error) {
      console.error('❌ Error pushing subscription to backend:', error);
    }
  }, [subscription, syncWithBackend]);

  const updateUsageWithSync = useCallback(async (type: keyof UsageStats, increment: number = 1) => {
    // Update local usage first
    const newUsageStats = {
      ...usageStats,
      [type]: usageStats[type] + increment,
    };
    setUsageStats(newUsageStats);
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(newUsageStats));

    // Sync with backend
    try {
      await googleAuthService.updateUsage(type, increment);
    } catch (error) {
      console.error('Failed to sync usage with backend:', error);
    }
  }, [usageStats]);

  // Payment service will be initialized lazily when needed (e.g., when user tries to subscribe)

  // Cleanup payment service on unmount
  useEffect(() => {
    return () => {
      paymentService.cleanup();
    };
  }, []);

  return useMemo(() => ({
    subscription,
    usageStats,
    isLoading,
    isProcessingPayment,
    availableProducts,
    isPaymentInitialized,
    isUpdatingSubscription,
    getCurrentPlan,
    canCreateNote,
    canGenerateFlashcards,
    canAskAIQuestion,
    canGenerateEssay,
    canUseCameraScanning,
    canUseAIEnhancedCards,
    trackNoteCreation,
    trackFlashcardGeneration,
    trackAIQuestion,
    trackEssayGeneration,
    subscribeToPlan,
    cancelSubscription,
    restorePurchases,
    initializePayment,
    activateTestProPlan,
    syncWithBackend,
    pushSubscriptionToBackend,
    updateUsageWithSync,
  }), [subscription, usageStats, isLoading, isProcessingPayment, availableProducts, isPaymentInitialized, isUpdatingSubscription, getCurrentPlan, canCreateNote, canGenerateFlashcards, canAskAIQuestion, canGenerateEssay, canUseCameraScanning, canUseAIEnhancedCards, trackNoteCreation, trackFlashcardGeneration, trackAIQuestion, trackEssayGeneration, subscribeToPlan, cancelSubscription, restorePurchases, initializePayment, activateTestProPlan, syncWithBackend, pushSubscriptionToBackend, updateUsageWithSync]);
});
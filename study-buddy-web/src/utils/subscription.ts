export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  limits: {
    notes: number;
    flashcards: number;
    messages: number;
    essays: number;
    ocrScans: number;
  };
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  isActive: boolean;
  expiresAt: string | null;
  usage: {
    notes: number;
    flashcards: number;
    messages: number;
    essays: number;
    ocrScans: number;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      '5 notes',
      '25 flashcards',
      '10 AI questions',
      '1 essay',
      'OCR text extraction'
    ],
    limits: {
      notes: 5,
      flashcards: 25,
      messages: 10,
      essays: 1,
      ocrScans: 3
    }
  },
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    price: 9.99,
    billingPeriod: 'monthly',
    features: [
      'Unlimited notes',
      'Unlimited flashcards',
      'Unlimited AI questions',
      'Unlimited essays',
      'Unlimited OCR scans',
      'Priority support',
      'Advanced AI features'
    ],
    limits: {
      notes: -1, // -1 means unlimited
      flashcards: -1,
      messages: -1,
      essays: -1,
      ocrScans: -1
    }
  },
  {
    id: 'pro-yearly',
    name: 'Pro Yearly',
    price: 9.99,
    yearlyPrice: 99.99,
    billingPeriod: 'yearly',
    features: [
      'Unlimited notes',
      'Unlimited flashcards',
      'Unlimited AI questions',
      'Unlimited essays',
      'Unlimited OCR scans',
      'Priority support',
      'Advanced AI features',
      'Save 17% with yearly billing'
    ],
    limits: {
      notes: -1, // -1 means unlimited
      flashcards: -1,
      messages: -1,
      essays: -1,
      ocrScans: -1
    }
  }
];

const STORAGE_KEY_SUBSCRIPTION = 'studyBuddySubscription';
const STORAGE_KEY_USAGE = 'studyBuddyUsage';

export const getCurrentSubscription = (): UserSubscription => {
  if (typeof window === 'undefined') {
    return {
      plan: SUBSCRIPTION_PLANS[0], // Free plan
      isActive: true,
      expiresAt: null,
      usage: { notes: 0, flashcards: 0, messages: 0, essays: 0, ocrScans: 0 }
    };
  }

  const savedSubscription = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
  const savedUsage = localStorage.getItem(STORAGE_KEY_USAGE);

  if (savedSubscription) {
    const subscription = JSON.parse(savedSubscription);
    const usage = savedUsage ? JSON.parse(savedUsage) : { notes: 0, flashcards: 0, messages: 0, essays: 0, ocrScans: 0 };
    
    return {
      ...subscription,
      usage
    };
  }

  // Default to free plan
  const defaultSubscription: UserSubscription = {
    plan: SUBSCRIPTION_PLANS[0],
    isActive: true,
    expiresAt: null,
    usage: { notes: 0, flashcards: 0, messages: 0, essays: 0, ocrScans: 0 }
  };

  localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(defaultSubscription));
  localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(defaultSubscription.usage));
  
  return defaultSubscription;
};

export const updateUsage = (type: keyof UserSubscription['usage'], increment: number = 1) => {
  if (typeof window === 'undefined') return;

  const subscription = getCurrentSubscription();
  const newUsage = {
    ...subscription.usage,
    [type]: subscription.usage[type] + increment
  };

  localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(newUsage));
  
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('subscriptionUpdated', { 
    detail: { ...subscription, usage: newUsage } 
  }));
};

export const canUseFeature = (type: keyof UserSubscription['usage']): boolean => {
  const subscription = getCurrentSubscription();
  const limit = subscription.plan.limits[type];
  
  // -1 means unlimited
  if (limit === -1) return true;
  
  return subscription.usage[type] < limit;
};

export const getRemainingUsage = (type: keyof UserSubscription['usage']): number => {
  const subscription = getCurrentSubscription();
  const limit = subscription.plan.limits[type];
  
  // -1 means unlimited
  if (limit === -1) return -1;
  
  return Math.max(0, limit - subscription.usage[type]);
};

export const upgradeToPro = (planId: string = 'pro-monthly') => {
  if (typeof window === 'undefined') return;

  const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || SUBSCRIPTION_PLANS[1];
  const expirationDays = selectedPlan.billingPeriod === 'yearly' ? 365 : 30;
  
  const proSubscription: UserSubscription = {
    plan: selectedPlan,
    isActive: true,
    expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString(),
    usage: getCurrentSubscription().usage // Keep current usage
  };

  localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(proSubscription));
  
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('subscriptionUpdated', { detail: proSubscription }));
};

export const downgradeToFree = () => {
  if (typeof window === 'undefined') return;

  const freeSubscription: UserSubscription = {
    plan: SUBSCRIPTION_PLANS[0], // Free plan
    isActive: true,
    expiresAt: null, // Free plan doesn't expire
    usage: getCurrentSubscription().usage // Keep current usage
  };

  localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(freeSubscription));
  
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('subscriptionUpdated', { detail: freeSubscription }));
};

export const getUsagePercentage = (type: keyof UserSubscription['usage']): number => {
  const subscription = getCurrentSubscription();
  const limit = subscription.plan.limits[type];
  
  // -1 means unlimited
  if (limit === -1) return 0;
  
  return Math.min(100, (subscription.usage[type] / limit) * 100);
};

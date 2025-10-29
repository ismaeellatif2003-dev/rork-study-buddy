'use client';

import { useState, useEffect } from 'react';
import { Crown, Check, Star, Zap, FileText, MessageCircle, BookOpen, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { SUBSCRIPTION_PLANS } from '@/utils/subscription';
import { Suspense } from 'react';

function SubscriptionPageContent() {
  const { subscription, isLoading, isAuthenticated, backendToken, refreshSubscription } = useAuth();
  const { data: session } = useSession();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const searchParams = useSearchParams();
  
  // Check for URL parameters
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  // Add safety checks for subscription object
  const isProUser = subscription?.plan?.id === 'pro-monthly' || subscription?.plan?.id === 'pro-yearly';

  // Handle success/cancel messages
  useEffect(() => {
    if (isSuccess) {
      // Refresh subscription data when returning from successful checkout
      refreshSubscription();
    }
  }, [isSuccess, refreshSubscription]);

  // Show sign-in prompt if not authenticated (check this first)
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign In Required
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to view and manage your subscription.
            </p>
            <a 
              href="/auth/signin"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Sign In with Google
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if subscription is not properly initialized (only for authenticated users)
  if (isLoading || !subscription || !subscription.plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading subscription information...</div>
        </div>
      </div>
    );
  }

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true);
    try {
      // Get user email from session
      const userEmail = session?.user?.email;
      if (!userEmail) {
        throw new Error('User email not found');
      }
      
      // Map plan ID to Stripe price ID
      let priceId;
      if (planId === 'pro-monthly') {
        priceId = process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_ID;
      } else if (planId === 'pro-yearly') {
        priceId = process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_ID;
      } else {
        throw new Error('Invalid plan ID');
      }
      
      if (!priceId) {
        throw new Error('Price ID not configured');
      }
      
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userEmail,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDowngrade = async () => {
    // Check if subscription was purchased on mobile
    const isMobilePurchase = subscription?.purchasePlatform === 'mobile';
    
    if (isMobilePurchase) {
      alert('This subscription was purchased through the mobile app. Please cancel it through the mobile app or Apple ID settings.');
      return;
    }
    
    if (confirm('Are you sure you want to downgrade to the Free plan? You will lose unlimited access to all features and be limited to 5 notes, 25 flashcards, 10 AI questions, and 1 essay.')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/downgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${backendToken}`
          },
          body: JSON.stringify({
            planId: 'free',
            expiresAt: null
          })
        });

        if (response.ok) {
          // Refresh subscription data from backend
          await refreshSubscription();
          alert('Successfully downgraded to Free plan. You now have limited access to features.');
        } else {
          throw new Error('Downgrade failed');
        }
      } catch (error) {
        console.error('Downgrade error:', error);
        alert('Failed to downgrade subscription. Please try again.');
      }
    }
  };

  const getUsagePercentage = (used: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((used / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatUsage = (used: number, max: number) => {
    if (max === -1) return `${used} / Unlimited`;
    return `${used} / ${max}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {isSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <p className="text-green-800 dark:text-green-200 font-medium">
                Payment successful! Your subscription has been activated.
              </p>
            </div>
          </div>
        )}

        {/* Cancel Message */}
        {isCanceled && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Checkout was canceled. You can try again anytime.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <Crown className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Study Buddy Pro</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Unlock unlimited access to all AI-powered study features
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current Plan</h2>
                <p className="text-gray-600 dark:text-gray-400">You&apos;re currently on the {subscription?.plan?.name || 'Free'} plan</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{subscription?.plan?.billingPeriod === 'yearly' ? subscription?.plan?.yearlyPrice : subscription?.plan?.price || 0}
                  /{subscription?.plan?.billingPeriod === 'yearly' ? 'year' : 'month'}
                </div>
                {isProUser && (
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">Active</div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Usage Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Usage This Month</h2>
            <p className="text-gray-600 dark:text-gray-400">Track your feature usage and limits</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notes Usage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Notes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatUsage(subscription?.usage?.notes || 0, subscription?.plan?.limits?.notes || 5)}
                  </span>
                  <span className={getUsageColor(getUsagePercentage(subscription?.usage?.notes || 0, subscription?.plan?.limits?.notes || 5))}>
                    {getUsagePercentage(subscription?.usage?.notes || 0, subscription?.plan?.limits?.notes || 5).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getUsageBarColor(getUsagePercentage(subscription?.usage?.notes || 0, subscription?.plan?.limits?.notes || 5))}`}
                    style={{ width: `${getUsagePercentage(subscription?.usage?.notes || 0, subscription?.plan?.limits?.notes || 5)}%` }}
                  ></div>
                </div>
              </div>

              {/* Flashcards Usage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} className="text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Flashcards</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatUsage(subscription?.usage?.flashcards || 0, subscription?.plan?.limits?.flashcards || 25)}
                  </span>
                  <span className={getUsageColor(getUsagePercentage(subscription?.usage?.flashcards || 0, subscription?.plan?.limits?.flashcards || 25))}>
                    {getUsagePercentage(subscription?.usage?.flashcards || 0, subscription?.plan?.limits?.flashcards || 25).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getUsageBarColor(getUsagePercentage(subscription?.usage?.flashcards || 0, subscription?.plan?.limits?.flashcards || 25))}`}
                    style={{ width: `${getUsagePercentage(subscription?.usage?.flashcards || 0, subscription?.plan?.limits?.flashcards || 25)}%` }}
                  ></div>
                </div>
              </div>

              {/* Messages Usage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-white">AI Messages</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatUsage(subscription?.usage?.messages || 0, subscription?.plan?.limits?.messages || 10)}
                  </span>
                  <span className={getUsageColor(getUsagePercentage(subscription?.usage?.messages || 0, subscription?.plan?.limits?.messages || 10))}>
                    {getUsagePercentage(subscription?.usage?.messages || 0, subscription?.plan?.limits?.messages || 10).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getUsageBarColor(getUsagePercentage(subscription?.usage?.messages || 0, subscription?.plan?.limits?.messages || 10))}`}
                    style={{ width: `${getUsagePercentage(subscription?.usage?.messages || 0, subscription?.plan?.limits?.messages || 10)}%` }}
                  ></div>
                </div>
              </div>

              {/* Essays Usage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-orange-600 dark:text-orange-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Essays</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatUsage(subscription?.usage?.essays || 0, subscription?.plan?.limits?.essays || 1)}
                  </span>
                  <span className={getUsageColor(getUsagePercentage(subscription?.usage?.essays || 0, subscription?.plan?.limits?.essays || 1))}>
                    {getUsagePercentage(subscription?.usage?.essays || 0, subscription?.plan?.limits?.essays || 1).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getUsageBarColor(getUsagePercentage(subscription?.usage?.essays || 0, subscription?.plan?.limits?.essays || 1))}`}
                    style={{ width: `${getUsagePercentage(subscription?.usage?.essays || 0, subscription?.plan?.limits?.essays || 1)}%` }}
                  ></div>
                </div>
              </div>

              {/* OCR Scans Usage */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Camera size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium text-gray-900 dark:text-white">OCR Scans</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatUsage(subscription?.usage?.ocrScans || 0, subscription?.plan?.limits?.ocrScans || 3)}
                  </span>
                  <span className={getUsageColor(getUsagePercentage(subscription?.usage?.ocrScans || 0, subscription?.plan?.limits?.ocrScans || 3))}>
                    {getUsagePercentage(subscription?.usage?.ocrScans || 0, subscription?.plan?.limits?.ocrScans || 3).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getUsageBarColor(getUsagePercentage(subscription?.usage?.ocrScans || 0, subscription?.plan?.limits?.ocrScans || 3))}`}
                    style={{ width: `${getUsagePercentage(subscription?.usage?.ocrScans || 0, subscription?.plan?.limits?.ocrScans || 3)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans - Inline Layout */}
        <div className="space-y-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.id} className={`${plan.id === 'pro-yearly' ? 'ring-2 ring-green-500' : plan.id === 'pro-monthly' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      {(plan.id === 'pro-monthly' || plan.id === 'pro-yearly') ? (
                        <Crown className="text-blue-600 dark:text-blue-400" size={24} />
                      ) : (
                        <Star className="text-gray-600 dark:text-gray-400" size={24} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                        {plan.id === 'pro-yearly' && (
                          <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Best Value
                          </span>
                        )}
                        {plan.id === 'pro-monthly' && (
                          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {plan.id === 'free' ? '5 notes, 25 flashcards, 10 AI questions, 1 essay' : 'Unlimited access to all features'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        £{plan.billingPeriod === 'yearly' ? plan.yearlyPrice : plan.price}
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                          /{plan.billingPeriod === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      {plan.billingPeriod === 'yearly' && plan.yearlyPrice && (
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Save £{((plan.price * 12) - plan.yearlyPrice).toFixed(2)}/year
                        </div>
                      )}
                      {plan.id === subscription?.plan?.id && (
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">Current Plan</div>
                      )}
                    </div>
                    
                    <div className="w-48">
                      {plan.id === subscription?.plan?.id ? (
                        <Button 
                          disabled 
                          className="w-full bg-gray-600 text-white cursor-not-allowed"
                        >
                          Current Plan
                        </Button>
                      ) : (plan.id === 'pro-monthly' || plan.id === 'pro-yearly') ? (
                        <Button 
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={isUpgrading}
                          className={`w-full ${
                            plan.id === 'pro-yearly' 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isUpgrading ? 'Processing...' : (plan.id === 'pro-yearly' ? 'Upgrade to Yearly' : 'Upgrade to Monthly')}
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleDowngrade}
                          className={`w-full ${
                            subscription?.purchasePlatform === 'mobile' 
                              ? 'bg-orange-600 text-white hover:bg-orange-700' 
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {subscription?.purchasePlatform === 'mobile' 
                            ? 'Cancel (Mobile Purchase)' 
                            : 'Downgrade to Free'
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Features List */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pro Benefits */}
        {!isProUser && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Why Upgrade to Pro?</h2>
              <p className="text-gray-600 dark:text-gray-400">Unlock the full potential of Study Buddy</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-3">
                    <Zap className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Unlimited Everything</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No limits on notes, flashcards, essays, or AI conversations
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mb-3">
                    <Star className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Priority Support</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Get help faster with priority customer support
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-3">
                    <Crown className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Advanced Features</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Access to new features and AI capabilities first
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Management for Pro Users */}
        {isProUser && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Management</h2>
              <p className="text-gray-600 dark:text-gray-400">Manage your subscription plan</p>
            </CardHeader>
            <CardContent>
              {subscription?.purchasePlatform === 'web' ? (
                // Web purchase - show Stripe customer portal
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Star className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Manage Your Subscription</h3>
                      <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                        Update your payment method, view billing history, or cancel your subscription through Stripe.
                      </p>
                      <Button 
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/stripe/portal', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userEmail: session?.user?.email }),
                            });
                            const { url } = await response.json();
                            window.open(url, '_blank');
                          } catch (error) {
                            console.error('Portal error:', error);
                            alert('Failed to open customer portal. Please try again.');
                          }
                        }}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Mobile purchase - show downgrade option
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Star className="text-red-600 dark:text-red-400" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">Downgrade to Free Plan</h3>
                      <p className="text-red-800 dark:text-red-200 text-sm mb-4">
                        You can downgrade to the Free plan at any time. You&apos;ll keep all your existing content, but will be limited to:
                      </p>
                      <ul className="text-red-800 dark:text-red-200 text-sm space-y-1 mb-4">
                        <li>• 5 notes</li>
                        <li>• 25 flashcards</li>
                        <li>• 10 AI questions</li>
                        <li>• 1 essay</li>
                        <li>• 3 OCR scans</li>
                      </ul>
                      <Button 
                        onClick={handleDowngrade}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Downgrade to Free Plan
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading subscription information...</div>
        </div>
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  );
}
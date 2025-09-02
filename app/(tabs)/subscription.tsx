import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Check, Crown, Zap, Star } from 'lucide-react-native';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/hooks/subscription-store';

export default function SubscriptionScreen() {
  const {
    subscription,
    usageStats,
    isProcessingPayment,
    isPaymentInitialized,
    getCurrentPlan,
    subscribeToPlan,
    cancelSubscription,
    restorePurchases,
  } = useSubscription();

  const currentPlan = getCurrentPlan();
  const isProUser = currentPlan.id !== 'free';
  const isMobile = Platform.OS !== 'web';

  const handleSubscribe = async (planId: string) => {
    if (!isMobile) {
      Alert.alert(
        'Mobile Only',
        'Subscriptions are only available on mobile devices.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (!isPaymentInitialized) {
      Alert.alert(
        'Payment Service Not Ready',
        'Please wait a moment and try again.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    Alert.alert(
      'Subscribe',
      `Subscribe to ${plan.name} for $${plan.price.toFixed(2)}/${plan.interval}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => subscribeToPlan(planId),
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You will lose access to Pro features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: cancelSubscription,
        },
      ]
    );
  };

  const formatPrice = (price: number, interval: string) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}/${interval}`;
  };

  const getUsageText = (used: number, limit: number) => {
    if (limit === -1) return `${used} (Unlimited)`;
    return `${used}/${limit}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Subscription' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Plan Status */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            {isProUser ? (
              <Crown size={28} color="#FFD700" />
            ) : (
              <Zap size={28} color="#666" />
            )}
            <Text style={styles.currentPlanTitle}>{currentPlan.name}</Text>
            {isProUser && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          
          {subscription && subscription.status === 'active' && (
            <Text style={styles.subscriptionInfo}>
              Active until {subscription.endDate.toLocaleDateString()}
            </Text>
          )}

          {/* Usage Stats */}
          <View style={styles.usageStats}>
            <Text style={styles.usageTitle}>This Month's Usage</Text>
            <View style={styles.usageGrid}>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>
                  {getUsageText(usageStats.notesCreated, currentPlan.maxNotes)}
                </Text>
                <Text style={styles.usageLabel}>Notes</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>
                  {getUsageText(usageStats.flashcardsGenerated, currentPlan.maxFlashcards)}
                </Text>
                <Text style={styles.usageLabel}>Flashcards</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>
                  {getUsageText(usageStats.aiQuestionsAsked, currentPlan.aiQuestionsPerDay)}
                </Text>
                <Text style={styles.usageLabel}>AI Questions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Available Plans */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan.id;
          const isPro = plan.id !== 'free';
          
          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isCurrentPlan && styles.currentPlanBorder,
                isPro && styles.proPlanCard,
              ]}
            >
              <View style={styles.planHeader}>
                <View style={styles.planTitleRow}>
                  <Text style={[styles.planName, isPro && styles.proPlanName]}>
                    {plan.name}
                  </Text>
                  {isPro && <Star size={20} color="#FFD700" />}
                  {isCurrentPlan && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.planPrice, isPro && styles.proPlanPrice]}>
                  {formatPrice(plan.price, plan.interval)}
                </Text>
                {plan.id === 'pro_yearly' && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>Save 17%</Text>
                  </View>
                )}
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureRow}>
                    <Check size={16} color={isPro ? "#4CAF50" : "#666"} />
                    <Text style={[styles.featureText, isPro && styles.proFeatureText]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {!isCurrentPlan && (
                <TouchableOpacity
                  style={[
                    styles.subscribeButton, 
                    isPro && styles.proSubscribeButton,
                    isProcessingPayment && styles.disabledButton
                  ]}
                  onPress={() => handleSubscribe(plan.id)}
                  disabled={isProcessingPayment || (isPro && !isMobile)}
                >
                  <Text style={[styles.subscribeButtonText, isPro && styles.proSubscribeButtonText]}>
                    {isProcessingPayment ? 'Processing...' : (plan.id === 'free' ? 'Downgrade' : 'Upgrade')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isMobile && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={restorePurchases}
            >
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          )}

          {isProUser && subscription?.status === 'active' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  currentPlanCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPlanTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 12,
    color: '#1a1a1a',
    flex: 1,
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  proBadgeText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subscriptionInfo: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  usageStats: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  usageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageItem: {
    alignItems: 'center',
    flex: 1,
  },
  usageValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  proPlanCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  currentPlanBorder: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  planHeader: {
    marginBottom: 20,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 8,
    flex: 1,
  },
  proPlanName: {
    color: '#2E7D32',
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  proPlanPrice: {
    color: '#2E7D32',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  savingsBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  proFeatureText: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  subscribeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  proSubscribeButton: {
    backgroundColor: '#4CAF50',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  proSubscribeButtonText: {
    color: 'white',
  },
  actionButtons: {
    marginTop: 8,
  },
  restoreButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: 40,
  },
});
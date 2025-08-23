import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Check, Crown, Zap } from 'lucide-react-native';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/hooks/subscription-store';

export default function SubscriptionScreen() {
  const {
    subscription,
    usageStats,
    getCurrentPlan,
    subscribeToPlan,
    cancelSubscription,
  } = useSubscription();

  const currentPlan = getCurrentPlan();
  const isProUser = currentPlan.id !== 'free';

  const handleSubscribe = async (planId: string) => {
    Alert.alert(
      'Subscribe to Plan',
      `This would normally open the payment flow for ${SUBSCRIPTION_PLANS.find(p => p.id === planId)?.name}. In a real app, this would integrate with App Store/Google Play billing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mock Subscribe',
          onPress: () => subscribeToPlan(planId),
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.',
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
              <Crown size={24} color="#FFD700" />
            ) : (
              <Zap size={24} color="#666" />
            )}
            <Text style={styles.currentPlanTitle}>Current Plan: {currentPlan.name}</Text>
          </View>
          
          {subscription && subscription.status === 'active' && (
            <Text style={styles.subscriptionInfo}>
              Active until {subscription.endDate.toLocaleDateString()}
            </Text>
          )}

          {/* Usage Stats */}
          <View style={styles.usageStats}>
            <Text style={styles.usageTitle}>This Month's Usage</Text>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Notes Created:</Text>
              <Text style={styles.usageValue}>
                {getUsageText(usageStats.notesCreated, currentPlan.maxNotes)}
              </Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Flashcards Generated:</Text>
              <Text style={styles.usageValue}>
                {getUsageText(usageStats.flashcardsGenerated, currentPlan.maxFlashcards)}
              </Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>AI Questions Today:</Text>
              <Text style={styles.usageValue}>
                {getUsageText(usageStats.aiQuestionsAsked, currentPlan.aiQuestionsPerDay)}
              </Text>
            </View>
          </View>
        </View>

        {/* Available Plans */}
        <Text style={styles.sectionTitle}>Available Plans</Text>
        
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
                  {isPro && <Crown size={20} color="#FFD700" />}
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
                  <Text style={styles.savingsBadge}>Save 17%</Text>
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
                  style={[styles.subscribeButton, isPro && styles.proSubscribeButton]}
                  onPress={() => handleSubscribe(plan.id)}
                >
                  <Text style={[styles.subscribeButtonText, isPro && styles.proSubscribeButtonText]}>
                    {plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Cancel Subscription */}
        {isProUser && subscription?.status === 'active' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
          >
            <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
          </TouchableOpacity>
        )}

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
    padding: 16,
  },
  currentPlanCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPlanTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1a1a1a',
  },
  subscriptionInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  usageStats: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#666',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  proPlanCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#fafffe',
  },
  currentPlanBorder: {
    borderColor: '#007AFF',
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  proPlanName: {
    color: '#2E7D32',
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  proPlanPrice: {
    color: '#2E7D32',
  },
  savingsBadge: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
    flex: 1,
  },
  proFeatureText: {
    color: '#1a1a1a',
  },
  subscribeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  proSubscribeButton: {
    backgroundColor: '#4CAF50',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  proSubscribeButtonText: {
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacing: {
    height: 32,
  },
});
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Crown, Star, Zap, Check, X } from 'lucide-react-native';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/hooks/subscription-store';
import colors from '@/constants/colors';

interface EssayPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (planId: string) => void;
}

export default function EssayPaywallModal({ visible, onClose, onSubscribe }: EssayPaywallModalProps) {
  const { getCurrentPlan, usageStats } = useSubscription();
  const currentPlan = getCurrentPlan();
  const isProUser = currentPlan.id !== 'free';
  const proPlans = SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'free');

  const handleSubscribe = (planId: string) => {
    onSubscribe(planId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Crown size={48} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Unlock Unlimited Essays</Text>
            <Text style={styles.heroSubtitle}>
              You've used your free essay for this month. Upgrade to Pro for unlimited essay generation!
            </Text>
          </View>

          {/* Usage Stats */}
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>Your Usage This Month</Text>
            <View style={styles.usageStats}>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>{usageStats.essaysGenerated}</Text>
                <Text style={styles.usageLabel}>Essays Generated</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>1</Text>
                <Text style={styles.usageLabel}>Free Limit</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.usageNote}>You've reached your monthly limit</Text>
          </View>

          {/* Pro Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
            {proPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.id === 'pro_yearly' && styles.planCardFeatured
                ]}
                onPress={() => handleSubscribe(plan.id)}
              >
                {plan.id === 'pro_yearly' && (
                  <View style={styles.featuredBadge}>
                    <Star size={16} color={colors.cardBackground} />
                    <Text style={styles.featuredText}>Best Value</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>
                      £{plan.price.toFixed(2)}
                      <Text style={styles.planInterval}>/{plan.interval}</Text>
                    </Text>
                  </View>
                  <View style={styles.planIcon}>
                    <Crown size={24} color={colors.primary} />
                  </View>
                </View>

                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Check size={16} color={colors.success} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    plan.id === 'pro_yearly' && styles.subscribeButtonFeatured
                  ]}
                  onPress={() => handleSubscribe(plan.id)}
                >
                  <Text style={[
                    styles.subscribeButtonText,
                    plan.id === 'pro_yearly' && styles.subscribeButtonTextFeatured
                  ]}>
                    Subscribe Now
                  </Text>
                  <Zap size={16} color={plan.id === 'pro_yearly' ? colors.cardBackground : colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Why Upgrade?</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Zap size={20} color={colors.primary} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Unlimited Essays</Text>
                  <Text style={styles.benefitDescription}>
                    Generate as many essays as you need for all your assignments
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Crown size={20} color={colors.primary} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Premium Features</Text>
                  <Text style={styles.benefitDescription}>
                    Access to all Pro features including camera scanning and AI-enhanced flashcards
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Star size={20} color={colors.primary} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Priority Support</Text>
                  <Text style={styles.benefitDescription}>
                    Get help when you need it with priority customer support
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  usageCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  usageItem: {
    alignItems: 'center',
  },
  usageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  usageLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.error,
    borderRadius: 4,
  },
  usageNote: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  plansSection: {
    marginBottom: 32,
  },
  plansTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
  },
  planCardFeatured: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  featuredBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cardBackground,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  planInterval: {
    fontSize: 16,
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  subscribeButtonFeatured: {
    backgroundColor: colors.primary,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  subscribeButtonTextFeatured: {
    color: colors.cardBackground,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

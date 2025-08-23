import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, GraduationCap, CheckCircle } from 'lucide-react-native';
import { useUserProfile } from '@/hooks/user-profile-store';
import { EDUCATION_LEVELS, type EducationLevel } from '@/types/study';
import colors from '@/constants/colors';

export default function OnboardingScreen() {
  const { completeOnboarding } = useUserProfile();
  const [age, setAge] = useState('');
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<EducationLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    const ageNumber = parseInt(age);
    
    if (!age || isNaN(ageNumber) || ageNumber < 5 || ageNumber > 100) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 5 and 100.');
      return;
    }

    if (!selectedEducationLevel) {
      Alert.alert('Education Level Required', 'Please select your education level.');
      return;
    }

    setIsLoading(true);
    try {
      await completeOnboarding(ageNumber, selectedEducationLevel);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <GraduationCap color={colors.primary} size={64} />
          <Text style={styles.title}>Welcome to Study Buddy!</Text>
          <Text style={styles.subtitle}>
            Let&apos;s personalize your learning experience by getting to know you better.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User color={colors.primary} size={24} />
            <Text style={styles.sectionTitle}>How old are you?</Text>
          </View>
          <Text style={styles.sectionDescription}>
            This helps us adjust the complexity of explanations and examples.
          </Text>
          <TextInput
            style={styles.ageInput}
            value={age}
            onChangeText={setAge}
            placeholder="Enter your age"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GraduationCap color={colors.primary} size={24} />
            <Text style={styles.sectionTitle}>What&apos;s your education level?</Text>
          </View>
          <Text style={styles.sectionDescription}>
            This helps us generate flashcards with the right level of detail and vocabulary.
          </Text>
          
          <View style={styles.educationLevels}>
            {EDUCATION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.educationCard,
                  selectedEducationLevel === level.value && styles.educationCardSelected,
                ]}
                onPress={() => setSelectedEducationLevel(level.value)}
              >
                <View style={styles.educationCardHeader}>
                  <Text style={[
                    styles.educationLabel,
                    selectedEducationLevel === level.value && styles.educationLabelSelected,
                  ]}>
                    {level.label}
                  </Text>
                  {selectedEducationLevel === level.value && (
                    <CheckCircle color={colors.primary} size={20} />
                  )}
                </View>
                <Text style={[
                  styles.educationDescription,
                  selectedEducationLevel === level.value && styles.educationDescriptionSelected,
                ]}>
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.completeButton,
            (!age || !selectedEducationLevel || isLoading) && styles.completeButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={!age || !selectedEducationLevel || isLoading}
        >
          <Text style={[
            styles.completeButtonText,
            (!age || !selectedEducationLevel || isLoading) && styles.completeButtonTextDisabled,
          ]}>
            {isLoading ? 'Setting up...' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  ageInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  educationLevels: {
    gap: 12,
  },
  educationCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  educationCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  educationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  educationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  educationLabelSelected: {
    color: colors.primary,
  },
  educationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  educationDescriptionSelected: {
    color: colors.textPrimary,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  completeButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.cardBackground,
  },
  completeButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
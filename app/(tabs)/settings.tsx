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
import { User, GraduationCap, CheckCircle, Edit3 } from 'lucide-react-native';
import { useUserProfile } from '@/hooks/user-profile-store';
import { EDUCATION_LEVELS, type EducationLevel } from '@/types/study';
import colors from '@/constants/colors';

export default function SettingsScreen() {
  const { profile, updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editAge, setEditAge] = useState(profile?.age?.toString() || '');
  const [editEducationLevel, setEditEducationLevel] = useState<EducationLevel | null>(profile?.educationLevel || null);

  const handleSaveChanges = async () => {
    const ageNumber = parseInt(editAge);
    
    if (!editAge || isNaN(ageNumber) || ageNumber < 5 || ageNumber > 100) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 5 and 100.');
      return;
    }

    if (!editEducationLevel) {
      Alert.alert('Education Level Required', 'Please select your education level.');
      return;
    }

    try {
      await updateProfile({
        age: ageNumber,
        educationLevel: editEducationLevel,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Your profile has been updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update your profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditAge(profile?.age?.toString() || '');
    setEditEducationLevel(profile?.educationLevel || null);
    setIsEditing(false);
  };

  const getCurrentEducationLevel = () => {
    return EDUCATION_LEVELS.find(level => level.value === profile?.educationLevel);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Edit3 color={colors.primary} size={24} />
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <Text style={styles.sectionDescription}>
            This information helps us personalize your flashcards and learning experience.
          </Text>

          <View style={styles.profileCard}>
            <View style={styles.profileItem}>
              <View style={styles.profileItemHeader}>
                <User color={colors.primary} size={24} />
                <Text style={styles.profileItemTitle}>Age</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.ageInput}
                  value={editAge}
                  onChangeText={setEditAge}
                  placeholder="Enter your age"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={3}
                />
              ) : (
                <Text style={styles.profileItemValue}>{profile.age} years old</Text>
              )}
            </View>

            <View style={styles.separator} />

            <View style={styles.profileItem}>
              <View style={styles.profileItemHeader}>
                <GraduationCap color={colors.primary} size={24} />
                <Text style={styles.profileItemTitle}>Education Level</Text>
              </View>
              {isEditing ? (
                <View style={styles.educationLevels}>
                  {EDUCATION_LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.educationCard,
                        editEducationLevel === level.value && styles.educationCardSelected,
                      ]}
                      onPress={() => setEditEducationLevel(level.value)}
                    >
                      <View style={styles.educationCardHeader}>
                        <Text style={[
                          styles.educationLabel,
                          editEducationLevel === level.value && styles.educationLabelSelected,
                        ]}>
                          {level.label}
                        </Text>
                        {editEducationLevel === level.value && (
                          <CheckCircle color={colors.primary} size={20} />
                        )}
                      </View>
                      <Text style={[
                        styles.educationDescription,
                        editEducationLevel === level.value && styles.educationDescriptionSelected,
                      ]}>
                        {level.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View>
                  <Text style={styles.profileItemValue}>
                    {getCurrentEducationLevel()?.label}
                  </Text>
                  <Text style={styles.profileItemDescription}>
                    {getCurrentEducationLevel()?.description}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How this helps your learning</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • <Text style={styles.infoBold}>Age-appropriate content:</Text> We adjust vocabulary and complexity based on your age group
            </Text>
            <Text style={styles.infoText}>
              • <Text style={styles.infoBold}>Education level matching:</Text> Flashcards are tailored to your academic level
            </Text>
            <Text style={styles.infoText}>
              • <Text style={styles.infoBold}>Better examples:</Text> We provide relevant examples and explanations for your level
            </Text>
            <Text style={styles.infoText}>
              • <Text style={styles.infoBold}>Optimized difficulty:</Text> Questions are neither too easy nor too hard for you
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  profileSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  profileCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileItem: {
    marginVertical: 8,
  },
  profileItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  profileItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  profileItemValue: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 36,
  },
  profileItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 36,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  ageInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 36,
  },
  educationLevels: {
    gap: 12,
    marginLeft: 36,
  },
  educationCard: {
    backgroundColor: colors.background,
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
  infoSection: {
    marginTop: 32,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  infoBold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useMemo } from 'react';
import type { UserProfile, EducationLevel } from '@/types/study';

const STORAGE_KEY = 'study_buddy_user_profile';

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from storage
  useEffect(() => {
    let isMounted = true;
    
    const loadProfile = async () => {
      try {
        const profileData = await AsyncStorage.getItem(STORAGE_KEY);
        if (profileData && isMounted) {
          try {
            const parsed = JSON.parse(profileData);
            // Validate the parsed data structure
            if (parsed && 
                typeof parsed === 'object' && 
                typeof parsed.isOnboardingComplete === 'boolean' &&
                typeof parsed.age === 'number' &&
                typeof parsed.educationLevel === 'string') {
              if (isMounted) {
                setProfile(parsed);
              }
            } else {
              console.warn('Invalid profile data structure, resetting profile');
              try {
                await AsyncStorage.removeItem(STORAGE_KEY);
              } catch (removeError) {
                console.error('Error removing invalid profile data:', removeError);
              }
            }
          } catch (parseError) {
            console.error('Error parsing profile data:', parseError);
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
            } catch (removeError) {
              console.error('Error removing corrupted profile data:', removeError);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Clear corrupted data
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (clearError) {
          console.error('Error clearing corrupted profile data:', clearError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Save profile to storage
  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    try {
      // Validate profile before saving
      if (!newProfile || 
          typeof newProfile.age !== 'number' || 
          typeof newProfile.educationLevel !== 'string' ||
          typeof newProfile.isOnboardingComplete !== 'boolean') {
        throw new Error('Invalid profile data structure');
      }
      
      const profileString = JSON.stringify(newProfile);
      await AsyncStorage.setItem(STORAGE_KEY, profileString);
      setProfile(newProfile);
    } catch (error) {
      console.error('Error saving user profile:', error);
      // Re-throw with more context
      throw new Error(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    
    const updatedProfile = { ...profile, ...updates };
    await saveProfile(updatedProfile);
  }, [profile, saveProfile]);

  // Complete onboarding
  const completeOnboarding = useCallback(async (age: number, educationLevel: EducationLevel) => {
    const newProfile: UserProfile = {
      age,
      educationLevel,
      isOnboardingComplete: true,
    };
    await saveProfile(newProfile);
  }, [saveProfile]);

  // Get education level context for AI
  const getEducationContext = useCallback(() => {
    if (!profile) return '';
    
    const ageGroup = profile.age <= 11 ? 'child' : 
                    profile.age <= 14 ? 'young teen' :
                    profile.age <= 18 ? 'teenager' :
                    profile.age <= 25 ? 'young adult' : 'adult';
    
    const levelDescriptions = {
      elementary: 'elementary school level with simple vocabulary and basic concepts',
      middle_school: 'middle school level with age-appropriate explanations',
      high_school: 'high school level with more detailed explanations',
      college: 'college level with academic depth and complexity',
      graduate: 'graduate level with advanced concepts and terminology',
      professional: 'professional level with practical applications and expertise'
    };
    
    return `The user is a ${ageGroup} (age ${profile.age}) at ${levelDescriptions[profile.educationLevel]}. Adjust the complexity, vocabulary, and examples accordingly.`;
  }, [profile]);

  const isOnboardingComplete = profile?.isOnboardingComplete ?? false;

  return useMemo(() => ({
    profile,
    isLoading,
    saveProfile,
    updateProfile,
    completeOnboarding,
    getEducationContext,
    isOnboardingComplete,
  }), [profile, isLoading, saveProfile, updateProfile, completeOnboarding, getEducationContext, isOnboardingComplete]);
});
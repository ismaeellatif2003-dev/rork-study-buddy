// User profile management utility
// This manages user profile information including age and education level

export interface UserProfile {
  name: string;
  email: string;
  age: number | null;
  educationLevel: string;
  accountType: string;
  isOnboardingComplete?: boolean;
}

const STORAGE_KEY = 'studyBuddyUserProfile';

export const getUserProfile = async (): Promise<UserProfile> => {
  if (typeof window === 'undefined') {
    return {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: null,
      educationLevel: '',
      accountType: 'Free Plan',
      isOnboardingComplete: false
    };
  }
  
  // Try to load from backend first if authenticated
  const backendToken = localStorage.getItem('backendToken');
  if (backendToken) {
    try {
      console.log('🔄 Loading user profile from backend...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${backendToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          const backendProfile: UserProfile = {
            name: data.profile.name || 'User',
            email: data.profile.email || '',
            age: data.profile.age,
            educationLevel: data.profile.educationLevel || '',
            accountType: data.profile.accountType || 'Free Plan',
            isOnboardingComplete: data.profile.isOnboardingComplete || false
          };
          
          // Save to localStorage as cache
          localStorage.setItem(STORAGE_KEY, JSON.stringify(backendProfile));
          console.log('✅ User profile loaded from backend and cached');
          return backendProfile;
        }
      }
    } catch (error) {
      console.error('❌ Failed to load user profile from backend:', error);
      // Fall back to localStorage
    }
  }
  
  // Load from localStorage as fallback
  const savedProfile = localStorage.getItem(STORAGE_KEY);
  if (savedProfile) {
    console.log('📱 User profile loaded from localStorage cache');
    return JSON.parse(savedProfile);
  }
  
  // Return default profile if no profile exists
  const defaultProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: null,
    educationLevel: '',
    accountType: 'Free Plan',
    isOnboardingComplete: false
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  const currentProfile = await getUserProfile();
  const updatedProfile = { ...currentProfile, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedProfile }));
};

export const getEducationLevels = () => [
  { value: '', label: 'Select education level' },
  { value: 'high-school', label: 'High School' },
  { value: 'some-college', label: 'Some College' },
  { value: 'associates', label: 'Associate Degree' },
  { value: 'bachelors', label: 'Bachelor\'s Degree' },
  { value: 'masters', label: 'Master\'s Degree' },
  { value: 'doctorate', label: 'Doctorate/PhD' },
  { value: 'professional', label: 'Professional Degree' },
  { value: 'other', label: 'Other' }
];

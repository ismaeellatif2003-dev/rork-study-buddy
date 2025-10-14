// User profile management utility
// This manages user profile information including age and education level

export interface UserProfile {
  name: string;
  email: string;
  age: number | null;
  educationLevel: string;
  accountType: string;
}

const STORAGE_KEY = 'studyBuddyUserProfile';

export const getUserProfile = (): UserProfile => {
  if (typeof window === 'undefined') {
    return {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: null,
      educationLevel: '',
      accountType: 'Free Plan'
    };
  }
  
  const savedProfile = localStorage.getItem(STORAGE_KEY);
  if (savedProfile) {
    return JSON.parse(savedProfile);
  }
  
  // Return default profile if no profile exists
  const defaultProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: null,
    educationLevel: '',
    accountType: 'Free Plan'
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
};

export const updateUserProfile = (updates: Partial<UserProfile>): void => {
  if (typeof window === 'undefined') return;
  
  const currentProfile = getUserProfile();
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

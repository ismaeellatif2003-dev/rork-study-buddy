export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flashcard {
  id: string;
  noteId: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StudySession {
  noteId: string;
  messages: ChatMessage[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxNotes: number;
  maxFlashcards: number;
  aiQuestionsPerDay: number;
  cameraScanning: boolean;
  aiEnhancedCards: boolean;
}

export interface UserSubscription {
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface UsageStats {
  notesCreated: number;
  flashcardsGenerated: number;
  aiQuestionsAsked: number;
  lastResetDate: Date;
}

export interface UserProfile {
  age: number;
  educationLevel: EducationLevel;
  isOnboardingComplete: boolean;
}

export type EducationLevel = 
  | 'elementary'
  | 'middle_school'
  | 'high_school'
  | 'college'
  | 'graduate'
  | 'professional';

export const EDUCATION_LEVELS: { value: EducationLevel; label: string; description: string }[] = [
  { value: 'elementary', label: 'Elementary School', description: 'Ages 5-11' },
  { value: 'middle_school', label: 'Middle School', description: 'Ages 11-14' },
  { value: 'high_school', label: 'High School', description: 'Ages 14-18' },
  { value: 'college', label: 'College/University', description: 'Undergraduate level' },
  { value: 'graduate', label: 'Graduate School', description: 'Masters/PhD level' },
  { value: 'professional', label: 'Professional', description: 'Working professional' },
];
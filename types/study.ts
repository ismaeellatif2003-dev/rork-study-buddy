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
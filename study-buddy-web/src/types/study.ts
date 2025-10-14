export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  noteId?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Essay {
  id: string;
  title: string;
  prompt: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
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
  maxEssays: number;
  cameraScanning: boolean;
  aiEnhancedCards: boolean;
}

export interface UserSubscription {
  id: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  transactionId?: string;
  originalTransactionId?: string;
}

export interface UsageStats {
  notesCreated: number;
  flashcardsGenerated: number;
  aiQuestionsAsked: number;
  essaysGenerated: number;
  lastResetDate: string;
}

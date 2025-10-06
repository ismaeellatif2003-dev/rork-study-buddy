import { router } from 'expo-router';

/**
 * Utility functions for handling subscription limits and navigation
 */

export const handleSubscriptionLimit = (limitType: 'notes' | 'flashcards' | 'essays' | 'ai-questions') => {
  // Navigate to subscription tab
  router.push('/(tabs)/subscription');
  
  // Optional: You could also show a brief toast notification here
  // Toast.show('Upgrade to Pro for unlimited access!', { duration: 2000 });
};

export const handleNoteLimit = () => {
  handleSubscriptionLimit('notes');
};

export const handleFlashcardLimit = () => {
  handleSubscriptionLimit('flashcards');
};

export const handleEssayLimit = () => {
  handleSubscriptionLimit('essays');
};

export const handleAIQuestionLimit = () => {
  handleSubscriptionLimit('ai-questions');
};

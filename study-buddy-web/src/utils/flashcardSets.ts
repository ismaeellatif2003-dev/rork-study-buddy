// Flashcard sets management utility
// This manages user-generated flashcard sets from notes

// Generate a truly unique ID to prevent collisions
export const generateUniqueId = (prefix: string = 'set'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const counter = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}-${counter}`;
};

// Normalize flashcard data from different sources
export const normalizeFlashcard = (card: Record<string, unknown>) => {
  return {
    id: (card.id as string)?.toString() || generateUniqueId('card'),
    front: (card.front as string) || (card.question as string) || '',
    back: (card.back as string) || (card.answer as string) || '',
    category: (card.category as string) || (card.set_name as string) || 'General',
    difficulty: (card.difficulty as string) || 'Medium',
    createdAt: (card.createdAt as string) || (card.created_at as string) || new Date().toISOString(),
  };
};

// Normalize flashcard set data from different sources
export const normalizeFlashcardSet = (set: Record<string, unknown>, source: 'backend' | 'user' | 'mock' = 'user') => {
  const flashcards = (set.flashcards as Record<string, unknown>[]) || [];
  const normalizedCards = flashcards.map(normalizeFlashcard);
  
  return {
    id: `${source}-${set.id}`,
    name: (set.name as string) || 'Untitled Set',
    description: (set.description as string) || '',
    cardCount: normalizedCards.length,
    createdAt: (set.createdAt as string) || (set.created_at as string) || new Date().toISOString(),
    sourceNoteId: set.sourceNoteId as string,
    sourceNoteTitle: set.sourceNoteTitle as string,
    flashcards: normalizedCards,
    source,
  };
};

export interface FlashcardSet {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  createdAt: string;
  sourceNoteId?: string;
  sourceNoteTitle?: string;
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
    category: string;
    difficulty: string;
    createdAt: string;
  }>;
}

const STORAGE_KEY = 'studyBuddyFlashcardSets';

export const getFlashcardSets = (): FlashcardSet[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const savedSets = localStorage.getItem(STORAGE_KEY);
  if (savedSets) {
    return JSON.parse(savedSets);
  }
  
  // Return empty array if no sets exist
  return [];
};

export const addFlashcardSet = (flashcardSet: FlashcardSet): void => {
  if (typeof window === 'undefined') return;
  
  const existingSets = getFlashcardSets();
  const updatedSets = [flashcardSet, ...existingSets];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSets));
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('flashcardSetsUpdated', { detail: updatedSets }));
};

export const updateFlashcardSet = (setId: string, updatedSet: Partial<FlashcardSet>): void => {
  if (typeof window === 'undefined') return;
  
  const existingSets = getFlashcardSets();
  const updatedSets = existingSets.map(set => 
    set.id === setId ? { ...set, ...updatedSet } : set
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSets));
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('flashcardSetsUpdated', { detail: updatedSets }));
};

export const deleteFlashcardSet = (setId: string): void => {
  if (typeof window === 'undefined') return;
  
  const existingSets = getFlashcardSets();
  const updatedSets = existingSets.filter(set => set.id !== setId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSets));
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('flashcardSetsUpdated', { detail: updatedSets }));
};

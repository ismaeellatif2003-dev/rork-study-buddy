// Flashcard sets management utility
// This manages user-generated flashcard sets from notes

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
    question: string;
    answer: string;
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

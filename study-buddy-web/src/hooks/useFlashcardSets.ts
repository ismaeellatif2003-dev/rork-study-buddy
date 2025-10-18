import { useState, useCallback, useEffect } from 'react';
import { generateUniqueId } from '@/utils/flashcardSets';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: string;
  createdAt: string;
}

export interface FlashcardSet {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  createdAt: string;
  sourceNoteId?: string;
  sourceNoteTitle?: string;
  flashcards: Flashcard[];
}

const STORAGE_KEY = 'studyBuddyFlashcardSets';

export const useFlashcardSets = () => {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load flashcard sets from localStorage after hydration
  useEffect(() => {
    try {
      const savedSets = localStorage.getItem(STORAGE_KEY);
      if (savedSets) {
        setFlashcardSets(JSON.parse(savedSets));
      }
    } catch (error) {
      console.error('Error loading flashcard sets:', error);
    }
    setMounted(true);
  }, []);

  const saveFlashcardSets = useCallback((newSets: FlashcardSet[]) => {
    setFlashcardSets(newSets);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSets));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('flashcardSetsUpdated', { detail: newSets }));
      } catch (error) {
        console.error('Error saving flashcard sets:', error);
      }
    }
  }, []);

  const addFlashcardSet = useCallback((set: Omit<FlashcardSet, 'id' | 'createdAt'>) => {
    const newSet: FlashcardSet = {
      ...set,
      id: generateUniqueId('flashcard-set'),
      createdAt: new Date().toISOString(),
    };
    
    const updatedSets = [...flashcardSets, newSet];
    saveFlashcardSets(updatedSets);
    return newSet;
  }, [flashcardSets, saveFlashcardSets]);

  const updateFlashcardSet = useCallback((id: string, updates: Partial<Omit<FlashcardSet, 'id' | 'createdAt'>>) => {
    const updatedSets = flashcardSets.map(set =>
      set.id === id
        ? { ...set, ...updates }
        : set
    );
    saveFlashcardSets(updatedSets);
  }, [flashcardSets, saveFlashcardSets]);

  const deleteFlashcardSet = useCallback((id: string) => {
    const updatedSets = flashcardSets.filter(set => set.id !== id);
    saveFlashcardSets(updatedSets);
  }, [flashcardSets, saveFlashcardSets]);

  return {
    flashcardSets,
    addFlashcardSet,
    updateFlashcardSet,
    deleteFlashcardSet,
    mounted,
  };
};

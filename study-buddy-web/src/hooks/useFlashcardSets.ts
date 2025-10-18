import { useState, useCallback, useEffect } from 'react';
import { generateUniqueId } from '@/utils/flashcardSets';
import { flashcardsApi } from '@/services/dataService';
import { useAuth } from '@/contexts/AuthContext';

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
  const { isAuthenticated } = useAuth();

  // Load flashcard sets from backend and localStorage
  useEffect(() => {
    const loadFlashcardSets = async () => {
      try {
        if (isAuthenticated) {
          // Load from backend first if authenticated
          try {
            console.log('🔄 Loading flashcard sets from backend...');
            const response = await flashcardsApi.getAll();
            console.log('📄 Backend flashcard response:', response);
            
            if (response.success && response.flashcards) {
              // Group backend flashcards by set
              const setMap = new Map<string, FlashcardSet>();
              
              response.flashcards.forEach((card: any) => {
                const setId = card.set_id || 'default-set';
                if (!setMap.has(setId)) {
                  setMap.set(setId, {
                    id: setId,
                    name: card.set_name || 'Flashcard Set',
                    description: card.set_description || '',
                    cardCount: 0,
                    createdAt: card.created_at || new Date().toISOString(),
                    flashcards: []
                  });
                }
                
                const set = setMap.get(setId)!;
                set.flashcards.push({
                  id: card.id.toString(),
                  front: card.front,
                  back: card.back,
                  category: 'Generated',
                  difficulty: card.difficulty || 'medium',
                  createdAt: card.created_at || new Date().toISOString()
                });
                set.cardCount = set.flashcards.length;
              });
              
              const backendSets = Array.from(setMap.values());
              setFlashcardSets(backendSets);
              // Also save to localStorage as cache
              localStorage.setItem(STORAGE_KEY, JSON.stringify(backendSets));
              console.log('✅ Backend flashcard sets loaded:', backendSets.length);
              return;
            }
          } catch (backendError) {
            console.error('❌ Failed to load flashcard sets from backend:', backendError);
            // Fall back to localStorage
          }
        }
        
        // Load from localStorage as fallback
        const savedSets = localStorage.getItem(STORAGE_KEY);
        if (savedSets) {
          setFlashcardSets(JSON.parse(savedSets));
          console.log('📱 Flashcard sets loaded from localStorage:', JSON.parse(savedSets).length);
        }
      } catch (error) {
        console.error('Error loading flashcard sets:', error);
      }
    };

    loadFlashcardSets();
    setMounted(true);
  }, [isAuthenticated]);

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

  const addFlashcardSet = useCallback(async (set: Omit<FlashcardSet, 'id' | 'createdAt'>) => {
    const newSet: FlashcardSet = {
      ...set,
      id: generateUniqueId('flashcard-set'),
      createdAt: new Date().toISOString(),
    };
    
    // Save to localStorage immediately
    const updatedSets = [...flashcardSets, newSet];
    saveFlashcardSets(updatedSets);
    
    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        console.log('🔄 Syncing flashcard set to backend...');
        const flashcardsForBackend = newSet.flashcards.map((card) => ({
          set_id: newSet.id,
          set_name: newSet.name,
          set_description: newSet.description,
          front: card.front,
          back: card.back,
          difficulty: card.difficulty || 'medium',
        }));
        
        const response = await flashcardsApi.sync('web', flashcardsForBackend);
        console.log('✅ Flashcard set synced to backend:', response);
      } catch (backendError) {
        console.error('❌ Failed to sync flashcard set to backend:', backendError);
        // Don't fail the operation if backend sync fails
      }
    }
    
    return newSet;
  }, [flashcardSets, saveFlashcardSets, isAuthenticated]);

  const updateFlashcardSet = useCallback((id: string, updates: Partial<Omit<FlashcardSet, 'id' | 'createdAt'>>) => {
    const updatedSets = flashcardSets.map(set =>
      set.id === id
        ? { ...set, ...updates }
        : set
    );
    saveFlashcardSets(updatedSets);
  }, [flashcardSets, saveFlashcardSets]);

  const deleteFlashcardSet = useCallback(async (id: string) => {
    const updatedSets = flashcardSets.filter(set => set.id !== id);
    saveFlashcardSets(updatedSets);
    
    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        console.log('🔄 Syncing flashcard set deletion to backend...');
        const response = await flashcardsApi.deleteSet(id);
        console.log('✅ Flashcard set deletion synced to backend:', response);
      } catch (backendError) {
        console.error('❌ Failed to sync flashcard set deletion to backend:', backendError);
        // Don't fail the operation if backend sync fails
      }
    }
  }, [flashcardSets, saveFlashcardSets, isAuthenticated]);

  const deleteFlashcardFromSet = useCallback((setId: string, cardId: string) => {
    const updatedSets = flashcardSets.map(set => {
      if (set.id === setId) {
        const updatedFlashcards = set.flashcards.filter(card => card.id !== cardId);
        return {
          ...set,
          flashcards: updatedFlashcards,
          cardCount: updatedFlashcards.length
        };
      }
      return set;
    });
    saveFlashcardSets(updatedSets);
  }, [flashcardSets, saveFlashcardSets]);

  return {
    flashcardSets,
    addFlashcardSet,
    updateFlashcardSet,
    deleteFlashcardSet,
    deleteFlashcardFromSet,
    mounted,
  };
};

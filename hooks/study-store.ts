import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useMemo } from 'react';
import type { Note, Flashcard, ChatMessage, StudySession } from '@/types/study';
import { notesApi, flashcardsApi } from '@/services/dataService';
import { toBackendFormat, toMobileFormat } from '@/utils/flashcard-sync';


const STORAGE_KEYS = {
  NOTES: 'study_buddy_notes',
  FLASHCARDS: 'study_buddy_flashcards', 
  SESSIONS: 'study_buddy_sessions',
};

export const [StudyProvider, useStudy] = createContextHook(() => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage - make it non-blocking
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // Load from local storage first (fast)
        const [localNotes, localFlashcards, localSessions] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.NOTES),
          AsyncStorage.getItem(STORAGE_KEYS.FLASHCARDS),
          AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        ]);

        if (!isMounted) return;

        // Set local data immediately
        if (localNotes) {
          setNotes(JSON.parse(localNotes));
        }
        if (localFlashcards) {
          setFlashcards(JSON.parse(localFlashcards));
        }
        if (localSessions) {
          setSessions(JSON.parse(localSessions));
        }
        
        setIsLoading(false);

        // Then try to sync with backend in background (non-blocking)
        setTimeout(async () => {
          try {
            const authToken = await AsyncStorage.getItem('authToken');
            
            if (authToken && isMounted) {
              // User is authenticated - load from backend
              const [notesResponse, flashcardsResponse] = await Promise.all([
                notesApi.getAll().catch(() => ({ success: false, notes: [] })),
                flashcardsApi.getAll().catch(() => ({ success: false, flashcards: [] })),
              ]);

              if (!isMounted) return;

              if (notesResponse.success && notesResponse.notes) {
                const backendNotes = notesResponse.notes.map((note: any) => ({
                  id: note.id.toString(),
                  title: note.title,
                  content: note.content,
                  summary: note.summary,
                  createdAt: new Date(note.created_at),
                  updatedAt: new Date(note.updated_at),
                }));
                setNotes(backendNotes);
                await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(backendNotes));
              }

              if (flashcardsResponse.success && flashcardsResponse.flashcards) {
                const backendFlashcards = flashcardsResponse.flashcards.map(toMobileFormat);
                setFlashcards(backendFlashcards);
                await AsyncStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(backendFlashcards));
              }
            }
          } catch (backendError) {
            console.log('Backend sync failed:', backendError);
          }
        }, 1000); // Delay backend sync by 1 second
      } catch (error) {
          console.error('Error loading data:', error);
          setIsLoading(false);
        }
      };

      loadData();
      
      return () => {
        isMounted = false;
      };
    }, []);

  // Force loading to complete after timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Study data loading timeout, forcing completion');
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Save notes to storage
  const saveNotes = useCallback(async (newNotes: Note[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  }, []);

  // Save flashcards to storage
  const saveFlashcards = useCallback(async (newFlashcards: Flashcard[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(newFlashcards));
      setFlashcards(newFlashcards);
    } catch (error) {
      console.error('Error saving flashcards:', error);
      throw error;
    }
  }, []);

  // Save sessions to storage
  const saveSessions = useCallback(async (newSessions: StudySession[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(newSessions));
      setSessions(newSessions);
    } catch (error) {
      console.error('Error saving sessions:', error);
      throw error;
    }
  }, []);

  // Subscription limits will be checked at the component level

  // Add or update note
  const saveNote = useCallback(async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      
      if (authToken) {
        // Save to backend
        const response = await notesApi.create({
          title: note.title,
          content: note.content,
          summary: note.summary,
        });
        
        if (response.success && response.note) {
          const backendNote: Note = {
            id: response.note.id.toString(),
            title: response.note.title,
            content: response.note.content,
            summary: response.note.summary,
            createdAt: new Date(response.note.created_at),
            updatedAt: new Date(response.note.updated_at),
          };
          
          const updatedNotes = [...notes, backendNote];
          setNotes(updatedNotes);
          await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
          return backendNote;
        }
      }
      
      // Fallback: Save to local storage only
      const newNote: Note = {
        ...note,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedNotes = [...notes, newNote];
      await saveNotes(updatedNotes);
      return newNote;
    } catch (error) {
      console.error('Error saving note:', error);
      // Fallback to local storage on error
      const newNote: Note = {
        ...note,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedNotes = [...notes, newNote];
      await saveNotes(updatedNotes);
      return newNote;
    }
  }, [notes, saveNotes]);

  // Update existing note
  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    );
    await saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  // Delete note
  const deleteNote = useCallback(async (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    const updatedFlashcards = flashcards.filter(card => card.noteId !== id);
    const updatedSessions = sessions.filter(session => session.noteId !== id);
    
    await Promise.all([
      saveNotes(updatedNotes),
      saveFlashcards(updatedFlashcards),
      saveSessions(updatedSessions),
    ]);
  }, [notes, flashcards, sessions, saveNotes, saveFlashcards, saveSessions]);

  // Subscription limits will be checked at the component level

  // Add flashcards for a note
  const addFlashcards = useCallback(async (noteId: string, newFlashcards: Omit<Flashcard, 'id'>[], noteTitle?: string) => {
    const flashcardsWithIds = newFlashcards.map(card => ({
      ...card,
      id: `${noteId}_${Date.now()}_${Math.random()}`,
    }));
    
    const updatedFlashcards = [...flashcards, ...flashcardsWithIds];
    await saveFlashcards(updatedFlashcards);

    // Sync to backend if authenticated
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        const setInfo = {
          set_id: `mobile-${noteId}`,
          set_name: noteTitle ? `Flashcards from "${noteTitle}"` : `Flashcards from Note ${noteId}`,
          set_description: noteTitle ? `AI-generated flashcards from your note: ${noteTitle}` : `Mobile-generated flashcards`,
        };
        
        const flashcardsForBackend = newFlashcards.map(card => 
          toBackendFormat(card, setInfo)
        );
        
        console.log('🔄 Syncing flashcards to backend:', flashcardsForBackend.length, 'cards');
        const syncResponse = await flashcardsApi.sync('mobile', flashcardsForBackend);
        console.log('✅ Backend sync successful:', syncResponse);
      }
    } catch (backendError) {
      console.error('Failed to sync flashcards to backend:', backendError?.message || backendError || 'Unknown error');
      // Don't fail the whole operation if backend sync fails
    }
  }, [flashcards, saveFlashcards]);

  // Get flashcards for a specific note
  const getFlashcardsForNote = useCallback((noteId: string) => {
    return flashcards.filter(card => card.noteId === noteId);
  }, [flashcards]);

  // Get all flashcard sets (grouped by set_id or noteId)
  const getFlashcardSets = useCallback(() => {
    const setMap = new Map<string, any>();
    
    flashcards.forEach(card => {
      const setId = card.set || card.noteId || 'default';
      const setName = card.set || `Note: ${notes.find(n => n.id === card.noteId)?.title || 'Unknown'}`;
      
      if (!setMap.has(setId)) {
        setMap.set(setId, {
          id: setId,
          name: setName,
          flashcards: [],
          source: card.noteId ? 'note' : 'set',
          noteId: card.noteId,
        });
      }
      
      setMap.get(setId).flashcards.push(card);
    });
    
    return Array.from(setMap.values());
  }, [flashcards, notes]);

  // Subscription limits will be checked at the component level

  // Add message to session
  const addMessageToSession = useCallback(async (noteId: string, message: Omit<ChatMessage, 'id'>) => {
    const messageWithId: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    const existingSessionIndex = sessions.findIndex(s => s.noteId === noteId);
    let updatedSessions: StudySession[];

    if (existingSessionIndex >= 0) {
      updatedSessions = sessions.map((session, index) => 
        index === existingSessionIndex 
          ? { ...session, messages: [...session.messages, messageWithId] }
          : session
      );
    } else {
      const newSession: StudySession = {
        noteId,
        messages: [messageWithId],
      };
      updatedSessions = [...sessions, newSession];
    }

    await saveSessions(updatedSessions);
  }, [sessions, saveSessions]);

  // Get session for note
  const getSessionForNote = useCallback((noteId: string) => {
    return sessions.find(session => session.noteId === noteId);
  }, [sessions]);

  return useMemo(() => ({
    notes,
    flashcards,
    sessions,
    isLoading,
    saveNote,
    updateNote,
    deleteNote,
    addFlashcards,
    getFlashcardsForNote,
    getFlashcardSets,
    addMessageToSession,
    getSessionForNote,
  }), [notes, flashcards, sessions, isLoading, saveNote, updateNote, deleteNote, addFlashcards, getFlashcardsForNote, getFlashcardSets, addMessageToSession, getSessionForNote]);
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState, useMemo } from 'react';
import type { Note, Flashcard, ChatMessage, StudySession } from '@/types/study';


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

  // Load data from storage
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const [notesData, flashcardsData, sessionsData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.NOTES),
          AsyncStorage.getItem(STORAGE_KEYS.FLASHCARDS),
          AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        ]);

        if (!isMounted) return;

        // Simple parsing with basic validation
        if (notesData) {
          try {
            const parsed = JSON.parse(notesData);
            if (Array.isArray(parsed)) {
              const validNotes = parsed.map(note => ({
                ...note,
                createdAt: new Date(note.createdAt),
                updatedAt: new Date(note.updatedAt),
              }));
              if (isMounted) setNotes(validNotes);
            }
          } catch (parseError) {
            console.error('Error parsing notes data:', parseError);
          }
        }
        
        if (flashcardsData && isMounted) {
          try {
            const parsed = JSON.parse(flashcardsData);
            if (Array.isArray(parsed)) {
              if (isMounted) setFlashcards(parsed);
            }
          } catch (parseError) {
            console.error('Error parsing flashcards data:', parseError);
          }
        }
        
        if (sessionsData && isMounted) {
          try {
            const parsed = JSON.parse(sessionsData);
            if (Array.isArray(parsed)) {
              const validSessions = parsed.map(session => ({
                ...session,
                messages: session.messages.map((message: any) => ({
                  ...message,
                  timestamp: new Date(message.timestamp),
                }))
              }));
              if (isMounted) setSessions(validSessions);
            }
          } catch (parseError) {
            console.error('Error parsing sessions data:', parseError);
          }
        }
      } catch (error) {
        console.error('Error loading study data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedNotes = [...notes, newNote];
    await saveNotes(updatedNotes);
    return newNote;
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
  const addFlashcards = useCallback(async (noteId: string, newFlashcards: Omit<Flashcard, 'id'>[]) => {
    const flashcardsWithIds = newFlashcards.map(card => ({
      ...card,
      id: `${noteId}_${Date.now()}_${Math.random()}`,
    }));
    
    const updatedFlashcards = [...flashcards, ...flashcardsWithIds];
    await saveFlashcards(updatedFlashcards);
  }, [flashcards, saveFlashcards]);

  // Get flashcards for a specific note
  const getFlashcardsForNote = useCallback((noteId: string) => {
    return flashcards.filter(card => card.noteId === noteId);
  }, [flashcards]);

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
    addMessageToSession,
    getSessionForNote,
  }), [notes, flashcards, sessions, isLoading, saveNote, updateNote, deleteNote, addFlashcards, getFlashcardsForNote, addMessageToSession, getSessionForNote]);
});
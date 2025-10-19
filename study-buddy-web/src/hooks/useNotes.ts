import { useState, useCallback, useEffect } from 'react';
import { notesApi } from '@/services/dataService';
import { useAuth } from '@/contexts/AuthContext';

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'studyBuddyNotes';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load notes from backend and localStorage
  useEffect(() => {
    const loadNotes = async () => {
      try {
        if (isAuthenticated) {
          // Load from backend first if authenticated
          try {
            console.log('🔄 Loading notes from backend...');
            const response = await notesApi.getAll();
            console.log('📄 Backend notes response:', response);
            
            if (response.success && response.notes) {
              const backendNotes = response.notes.map((note: { id: number; title: string; content: string; summary?: string; created_at: string; updated_at: string }) => ({
                id: note.id.toString(),
                title: note.title,
                content: note.content,
                summary: note.summary,
                createdAt: note.created_at,
                updatedAt: note.updated_at,
              }));
              setNotes(backendNotes);
              // Also save to localStorage as cache
              localStorage.setItem(STORAGE_KEY, JSON.stringify(backendNotes));
              console.log('✅ Backend notes loaded:', backendNotes.length);
              return;
            }
          } catch (backendError) {
            console.error('❌ Failed to load notes from backend:', backendError);
            // Fall back to localStorage
          }
        }
        
        // Load from localStorage as fallback
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        if (savedNotes) {
          setNotes(JSON.parse(savedNotes));
          console.log('📱 Notes loaded from localStorage:', JSON.parse(savedNotes).length);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };

    loadNotes();
    setMounted(true);
  }, [isAuthenticated]);

  const saveNotes = useCallback((newNotes: Note[]) => {
    setNotes(newNotes);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }
  }, []);

  const addNote = useCallback(async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Save to localStorage immediately
    const updatedNotes = [...notes, newNote];
    saveNotes(updatedNotes);
    
    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        console.log('🔄 Syncing note to backend...');
        const response = await notesApi.create({
          title: note.title,
          content: note.content,
          summary: note.summary
        });
        console.log('✅ Note synced to backend:', response);
      } catch (backendError) {
        console.error('❌ Failed to sync note to backend:', backendError);
        // Don't fail the operation if backend sync fails
      }
    }
    
    return newNote;
  }, [notes, saveNotes, isAuthenticated]);

  const updateNote = useCallback(async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );
    saveNotes(updatedNotes);
    
    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        console.log('🔄 Syncing note update to backend...');
        const response = await notesApi.update(parseInt(id), {
          title: updates.title,
          content: updates.content,
          summary: updates.summary
        });
        console.log('✅ Note update synced to backend:', response);
      } catch (backendError) {
        console.error('❌ Failed to sync note update to backend:', backendError);
        // Don't fail the operation if backend sync fails
      }
    }
  }, [notes, saveNotes, isAuthenticated]);

  const deleteNote = useCallback(async (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    saveNotes(updatedNotes);
    
    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        console.log('🔄 Syncing note deletion to backend...');
        const response = await notesApi.delete(parseInt(id));
        console.log('✅ Note deletion synced to backend:', response);
      } catch (backendError) {
        console.error('❌ Failed to sync note deletion to backend:', backendError);
        // Don't fail the operation if backend sync fails
      }
    }
  }, [notes, saveNotes, isAuthenticated]);

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    saveNotes,
    mounted,
  };
};

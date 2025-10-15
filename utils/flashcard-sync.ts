// Flashcard synchronization utilities for cross-platform compatibility

export interface NormalizedFlashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: string;
  createdAt: string;
  noteId?: string;
  set_id?: string;
}

export interface NormalizedFlashcardSet {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  createdAt: string;
  sourceNoteId?: string;
  sourceNoteTitle?: string;
  flashcards: NormalizedFlashcard[];
  source: 'backend' | 'mobile' | 'web';
}

// Generate a truly unique ID to prevent collisions
export const generateUniqueId = (prefix: string = 'set'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const counter = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}-${counter}`;
};

// Normalize flashcard data from different sources
export const normalizeFlashcard = (card: any): NormalizedFlashcard => {
  return {
    id: card.id?.toString() || generateUniqueId('card'),
    front: card.front || card.question || '',
    back: card.back || card.answer || '',
    category: card.category || card.set_name || 'General',
    difficulty: card.difficulty || 'Medium',
    createdAt: card.createdAt || card.created_at || new Date().toISOString(),
    noteId: card.noteId,
    set_id: card.set_id,
  };
};

// Normalize flashcard set data from different sources
export const normalizeFlashcardSet = (set: any, source: 'backend' | 'mobile' | 'web' = 'mobile'): NormalizedFlashcardSet => {
  const normalizedCards = (set.flashcards || []).map(normalizeFlashcard);
  
  return {
    id: `${source}-${set.id}`,
    name: set.name || 'Untitled Set',
    description: set.description || '',
    cardCount: normalizedCards.length,
    createdAt: set.createdAt || set.created_at || new Date().toISOString(),
    sourceNoteId: set.sourceNoteId,
    sourceNoteTitle: set.sourceNoteTitle,
    flashcards: normalizedCards,
    source,
  };
};

// Convert flashcard to backend format (handles both mobile and normalized formats)
export const toBackendFormat = (card: any, setInfo: { set_id: string; set_name: string; set_description?: string }) => {
  return {
    set_id: setInfo.set_id,
    set_name: setInfo.set_name,
    set_description: setInfo.set_description || '',
    front: card.front || card.question || '',
    back: card.back || card.answer || '',
    difficulty: (card.difficulty || 'medium').toLowerCase(),
  };
};

// Convert backend flashcard to mobile format
export const toMobileFormat = (card: any) => {
  // Determine if this is a note-based or set-based flashcard
  const isNoteBased = card.set_id?.startsWith('mobile-');
  const noteId = isNoteBased ? card.set_id?.replace('mobile-', '') : null;
  
  return {
    id: card.id?.toString() || generateUniqueId('card'),
    noteId: noteId,
    question: card.front,
    answer: card.back,
    set: card.set_name,
    difficulty: card.difficulty || 'medium',
    createdAt: new Date(card.created_at),
    updatedAt: new Date(card.updated_at),
  };
};

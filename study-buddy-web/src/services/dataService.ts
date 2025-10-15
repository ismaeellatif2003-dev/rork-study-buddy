const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://rork-study-buddy-production-eeeb.up.railway.app';

// Helper to get auth token from session
const getAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  // Try to get token from NextAuth session
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    
    // NextAuth stores the backend token in the session
    if (session?.backendToken) {
      return session.backendToken;
    }
    
    // Fallback to localStorage for compatibility
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return localStorage.getItem('authToken');
  }
};

// Helper for authenticated requests
const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// ==================== NOTES API ====================

export const notesApi = {
  async getAll() {
    return authFetch('/notes');
  },

  async create(noteData: { title: string; content: string; summary?: string }) {
    return authFetch('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  async update(noteId: number, noteData: { title?: string; content?: string; summary?: string }) {
    return authFetch(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
  },

  async delete(noteId: number) {
    return authFetch(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};

// ==================== FLASHCARDS API ====================

export const flashcardsApi = {
  async getAll() {
    return authFetch('/flashcards');
  },

  async create(flashcardsData: { flashcards: Array<{ set_id: string; set_name: string; set_description?: string; front: string; back: string; difficulty?: string }> }) {
    return authFetch('/flashcards', {
      method: 'POST',
      body: JSON.stringify(flashcardsData),
    });
  },
};

// ==================== ESSAYS API ====================

export const essaysApi = {
  async getAll() {
    return authFetch('/essays');
  },

  async create(essayData: any) {
    return authFetch('/essays', {
      method: 'POST',
      body: JSON.stringify(essayData),
    });
  },
};

// ==================== CHAT API ====================

export const chatApi = {
  async getHistory() {
    return authFetch('/chat/history');
  },

  async saveMessage(message: { role: string; content: string }) {
    return authFetch('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

// ==================== SYNC API ====================

export const syncApi = {
  async syncAll() {
    return authFetch('/auth/sync');
  },

  async updateUsage(type: string, increment: number = 1) {
    return authFetch('/usage/update', {
      method: 'POST',
      body: JSON.stringify({ type, increment }),
    });
  },
};

export default {
  notes: notesApi,
  flashcards: flashcardsApi,
  essays: essaysApi,
  chat: chatApi,
  sync: syncApi,
};


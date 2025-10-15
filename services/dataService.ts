import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://rork-study-buddy-production-eeeb.up.railway.app';

// Helper to get auth token
const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('authToken');
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

  console.log('🔐 Making authenticated request:', {
    endpoint,
    hasToken: !!token,
    tokenPrefix: token.substring(0, 20) + '...',
    url: `${API_BASE}${endpoint}`
  });

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    console.log('❌ Request failed:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });
    
    let errorMessage = 'Request failed';
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
      console.log('📄 JSON error response:', error);
    } catch (parseError) {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
        console.log('📄 Text error response:', errorText);
      } catch (textError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.log('📄 Could not parse error response:', textError);
      }
    }
    throw new Error(errorMessage);
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

  async sync(platform: 'mobile' | 'web', flashcards: any[]) {
    return authFetch('/flashcards/sync', {
      method: 'POST',
      body: JSON.stringify({ platform, flashcards }),
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


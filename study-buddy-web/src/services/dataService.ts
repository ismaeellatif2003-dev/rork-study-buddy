const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://rork-study-buddy-production-eeeb.up.railway.app';

// Helper to get auth token from session
const getAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  // Try to get token from NextAuth session
  try {
    console.log('🔍 Fetching NextAuth session...');
    const response = await fetch('/api/auth/session');
    console.log('🔍 Session response status:', response.status);
    const session = await response.json();
    
    console.log('🔍 Debug - NextAuth session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasBackendToken: !!session?.backendToken,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
      fullSession: session // Show the full session for debugging
    });
    
    // NextAuth stores the backend token in the session
    if (session?.backendToken) {
      console.log('✅ Found backend token in session');
      return session.backendToken;
    }
    
    console.log('⚠️ No backend token in session, checking localStorage');
    // Fallback to localStorage for compatibility
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      console.log('✅ Found token in localStorage');
      return localToken;
    }
    
    console.log('❌ No token found anywhere');
    return null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return localStorage.getItem('authToken');
  }
};

// Helper for authenticated requests
export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  if (!token) {
    console.error('❌ No authentication token found');
    console.error('💡 Solution: Please sign out and sign back in to get a fresh authentication token');
    throw new Error('Not authenticated - Please sign out and sign back in to refresh your authentication');
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
    url: `${API_BASE}${endpoint}`,
    method: options.method || 'GET'
  });

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      ok: response.ok
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

    const result = await response.json();
    console.log('✅ Request successful:', result);
    return result;
  } catch (error) {
    console.error('🚨 Network or fetch error:', error);
    console.error('🚨 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
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

  async sync(platform: 'mobile' | 'web', flashcards: Record<string, unknown>[]) {
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

  async create(essayData: Record<string, unknown>) {
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

// Profile API
export const profileApi = {
  async get() {
    return authFetch('/profile');
  },

  async update(profileData: {
    age?: number;
    educationLevel?: string;
    isOnboardingComplete?: boolean;
  }) {
    return authFetch('/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  async sync(platform: 'mobile' | 'web', profile: {
    age?: number;
    educationLevel?: string;
    isOnboardingComplete?: boolean;
  }) {
    return authFetch('/profile/sync', {
      method: 'POST',
      body: JSON.stringify({ platform, profile }),
    });
  },
};

const dataService = {
  notes: notesApi,
  flashcards: flashcardsApi,
  essays: essaysApi,
  chat: chatApi,
  sync: syncApi,
  profile: profileApi,
};

export default dataService;


const API_BASE_URL = 'https://rork-study-buddy-production-eeeb.up.railway.app';

class StudyBuddyAPI {
  constructor() {
    this.token = null;
  }

  async getToken() {
    if (!this.token) {
      const result = await chrome.storage.sync.get(['authToken']);
      this.token = result.authToken;
    }
    return this.token;
  }

  async setToken(token) {
    this.token = token;
    await chrome.storage.sync.set({ authToken: token });
  }

  async clearToken() {
    this.token = null;
    await chrome.storage.sync.remove(['authToken']);
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearToken();
        throw new Error('Authentication required. Please sign in.');
      }
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Notes API
  async createNote(title, content, summary = null) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content, summary }),
    });
  }

  // AI Chat API
  async personalizedChat(question, conversationHistory = []) {
    return this.request('/ai/personalized-chat', {
      method: 'POST',
      body: JSON.stringify({ question, conversationHistory }),
    });
  }

  // Video Analysis API
  async analyzeVideoUrl(url, userEmail) {
    return this.request('/video/analyze-url', {
      method: 'POST',
      body: JSON.stringify({ url, userEmail }),
    });
  }

  // Generate summary for text
  async generateSummary(text) {
    return this.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'text',
        prompt: `Please provide a concise summary of the following text:\n\n${text}`,
        maxTokens: 500,
      }),
    });
  }
}

// Export for use in service worker
if (typeof self !== 'undefined') {
  self.StudyBuddyAPI = StudyBuddyAPI;
}


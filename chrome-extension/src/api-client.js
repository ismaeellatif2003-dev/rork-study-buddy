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

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const responseData = await response.json().catch(() => ({ error: 'Invalid JSON response' }));

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearToken();
          throw new Error('Authentication required. Please sign in.');
        }
        throw new Error(responseData.error || responseData.message || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Notes API
  async createNote(title, content, summary = null) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content, summary }),
    });
  }

  // AI Chat API
  async personalizedChat(question, conversationHistory = [], selectedText = null) {
    return this.request('/ai/personalized-chat', {
      method: 'POST',
      body: JSON.stringify({ 
        question, 
        conversationHistory,
        selectedText: selectedText || null
      }),
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
        messages: [
          {
            role: 'system',
            content: 'You are an expert study assistant. Create a concise summary of the provided content with key points and main ideas.'
          },
          {
            role: 'user',
            content: `Summarize this content: ${text}`
          }
        ],
        type: 'summary',
        model: 'openai/gpt-3.5-turbo'
      }),
    });
  }

  // Get subscription status
  async getSubscriptionStatus() {
    return this.request('/auth/subscription-status', {
      method: 'GET',
    });
  }
}

// Export for use in service worker
if (typeof self !== 'undefined') {
  self.StudyBuddyAPI = StudyBuddyAPI;
}


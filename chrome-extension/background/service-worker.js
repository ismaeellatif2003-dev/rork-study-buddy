importScripts('../src/api-client.js');

const API_BASE_URL = 'https://rork-study-buddy-production-eeeb.up.railway.app';
const api = new StudyBuddyAPI();

// For testing: Skip authentication, use mock user
// In production, you'll need to implement proper authentication
async function checkAuthStatus() {
  // For testing, always return false (not authenticated)
  // Notes will be saved locally only
  return { authenticated: false, userEmail: null };
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'checkAuth':
          // Always return not authenticated for testing
          return { authenticated: false, userEmail: null };
          
        case 'saveNote':
          // For testing: Save note locally in Chrome storage
          const noteData = message.data;
          const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const note = {
            id: noteId,
            title: noteData.title,
            content: noteData.content,
            summary: noteData.summary || null,
            createdAt: new Date().toISOString()
          };
          
          // Get existing notes
          const { notes = [] } = await chrome.storage.local.get(['notes']);
          notes.push(note);
          
          // Save to local storage
          await chrome.storage.local.set({ notes });
          
          console.log('✅ Note saved locally:', noteId);
          return { success: true, note, message: 'Note saved locally (testing mode)' };
          
        case 'generateSummary':
          // For testing: Return mock summary
          return { 
            summary: `[TEST MODE] Summary: ${message.data.text.substring(0, 100)}... (Sign in to generate real summaries)` 
          };
          
        case 'aiChat':
          // For testing: Return mock response
          return { 
            response: `[TEST MODE] I can help you understand "${message.data.question.substring(0, 50)}...". Please sign in to use the full AI chat feature.` 
          };
          
        case 'analyzeVideo':
          // For testing: Return mock response
          return {
            id: `test-analysis-${Date.now()}`,
            title: 'Test Video Analysis',
            status: 'testing',
            message: 'Video analysis is disabled in test mode. Sign in to analyze videos.'
          };
          
        default:
          throw new Error('Unknown action: ' + message.action);
      }
    } catch (error) {
      console.error('Extension error:', error);
      return { error: error.message };
    }
  })().then(response => sendResponse(response));
  
  return true; // Keep channel open for async response
});

// On extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Study Buddy extension installed (Test Mode - No Authentication)');
});


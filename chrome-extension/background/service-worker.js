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
          // Connect to backend /ai/generate endpoint (no auth required)
          try {
            const text = message.data.text;
            
            const messages = [
              {
                role: 'system',
                content: 'You are a helpful study assistant. Generate a concise summary of the provided text.'
              },
              {
                role: 'user',
                content: `Please provide a concise summary of the following text:\n\n${text}`
              }
            ];
            
            const response = await fetch(`${API_BASE_URL}/ai/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages,
                type: 'text',
                model: 'openai/gpt-3.5-turbo'
              }),
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Summary generation failed');
            }
            
            const data = await response.json();
            return { 
              summary: data.response || data.text || 'Could not generate summary.',
              note: data.note // Will show if using mock response
            };
          } catch (error) {
            console.error('Summary generation error:', error);
            return { 
              summary: `Error: ${error.message}. Could not generate summary.`,
              error: error.message
            };
          }
          
        case 'aiChat':
          // Connect to backend /ai/generate endpoint (no auth required)
          try {
            const question = message.data.question;
            const selectedText = message.data.selectedText || '';
            
            // Build messages array for the API
            const messages = [
              {
                role: 'system',
                content: 'You are a helpful study assistant. Help explain concepts and answer questions about the selected text.'
              },
              {
                role: 'user',
                content: selectedText 
                  ? `Context: ${selectedText}\n\nQuestion: ${question}`
                  : question
              }
            ];
            
            const response = await fetch(`${API_BASE_URL}/ai/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages,
                type: 'text',
                model: 'openai/gpt-3.5-turbo'
              }),
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'AI request failed');
            }
            
            const data = await response.json();
            return { 
              response: data.response || data.text || 'I apologize, but I could not generate a response.',
              note: data.note // Will show if using mock response
            };
          } catch (error) {
            console.error('AI chat error:', error);
            return { 
              response: `Error: ${error.message}. The AI service may be unavailable.`,
              error: error.message
            };
          }
          
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


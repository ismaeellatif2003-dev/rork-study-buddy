importScripts('../src/api-client.js');

const API_BASE_URL = 'https://rork-study-buddy-production-eeeb.up.railway.app';
const api = new StudyBuddyAPI();

// Google OAuth Helper
async function getGoogleAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

// Authenticate with backend using Google access token
async function authenticateWithBackend(accessToken) {
  try {
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }

    const userInfo = await userInfoResponse.json();

    // Send access token to backend for authentication
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: accessToken, // Send access token (backend will handle verification)
        platform: 'chrome-extension',
        deviceInfo: {
          platform: 'chrome-extension',
          userAgent: navigator.userAgent,
          extensionId: chrome.runtime.id
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Authentication failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Backend authentication failed: ' + error.message);
  }
}

// Sign in with Google
async function signInWithGoogle() {
  try {
    // Step 1: Get Google access token
    const accessToken = await getGoogleAccessToken();
    
    // Step 2: Authenticate with backend
    const authResult = await authenticateWithBackend(accessToken);
    
    // Step 3: Store tokens and user info
    await chrome.storage.sync.set({
      authToken: authResult.token,
      userEmail: authResult.user.email,
      userName: authResult.user.name,
      userPicture: authResult.user.picture,
      userId: authResult.user.id.toString(),
      googleAccessToken: accessToken
    });
    
    return authResult;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

// Sign out
async function signOut() {
  // Get token to revoke it
  const { googleAccessToken } = await chrome.storage.sync.get(['googleAccessToken']);
  
  if (googleAccessToken) {
    // Revoke Google token
    chrome.identity.removeCachedAuthToken({ token: googleAccessToken });
  }
  
  // Clear all stored data
  await chrome.storage.sync.clear();
}

// Check authentication status
async function checkAuthStatus() {
  const { authToken, userEmail } = await chrome.storage.sync.get(['authToken', 'userEmail']);
  return { authenticated: !!authToken, userEmail: userEmail || null };
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'signIn':
          const authResult = await signInWithGoogle();
          return { success: true, user: authResult.user };
          
        case 'signOut':
          await signOut();
          return { success: true };
          
        case 'checkAuth':
          return await checkAuthStatus();
          
        case 'saveNote':
          const { authToken } = await chrome.storage.sync.get(['authToken']);
          if (!authToken) {
            throw new Error('Please sign in first');
          }
          
          const noteData = message.data;
          let summary = null;
          
          // Auto-generate summary if content is long
          if (noteData.content.length > 200) {
            try {
              await api.setToken(authToken);
              const summaryResponse = await api.generateSummary(noteData.content);
              summary = summaryResponse.response || summaryResponse.text;
            } catch (err) {
              console.error('Failed to generate summary:', err);
            }
          }
          
          // Update API client with token
          await api.setToken(authToken);
          const note = await api.createNote(noteData.title, noteData.content, summary);
          return { success: true, note };
          
        case 'generateSummary':
          const { authToken: summaryToken } = await chrome.storage.sync.get(['authToken']);
          if (!summaryToken) {
            throw new Error('Please sign in first');
          }
          
          await api.setToken(summaryToken);
          const summaryResponse = await api.generateSummary(message.data.text);
          return { summary: summaryResponse.response || summaryResponse.text };
          
        case 'aiChat':
          const { authToken: chatToken } = await chrome.storage.sync.get(['authToken']);
          if (!chatToken) {
            throw new Error('Please sign in first');
          }
          
          await api.setToken(chatToken);
          const chatResponse = await api.personalizedChat(
            message.data.question,
            message.data.conversationHistory || []
          );
          return { response: chatResponse.response };
          
        case 'analyzeVideo':
          const { authToken: videoToken, userEmail } = await chrome.storage.sync.get(['authToken', 'userEmail']);
          if (!videoToken || !userEmail) {
            throw new Error('Please sign in first');
          }
          
          await api.setToken(videoToken);
          const videoResponse = await api.analyzeVideoUrl(
            message.data.url,
            userEmail
          );
          return videoResponse;
          
        default:
          throw new Error('Unknown action: ' + message.action);
      }
    } catch (error) {
      return { error: error.message };
    }
  })().then(response => sendResponse(response));
  
  return true; // Keep channel open for async response
});

// Check authentication status on startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Study Buddy extension installed');
  const { authenticated } = await checkAuthStatus();
  if (!authenticated) {
    console.log('User not authenticated. They can sign in from the popup.');
  }
});


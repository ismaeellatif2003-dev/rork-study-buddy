importScripts('../src/api-client.js');

// API_BASE_URL is already defined in api-client.js, so we use it from there
const api = new StudyBuddyAPI();

// Check if user is authenticated
async function checkAuthStatus() {
  const token = await api.getToken();
  const userInfo = await chrome.storage.sync.get(['userEmail', 'userName', 'userPicture']);
  
  const isAuthenticated = !!token;
  let subscriptionStatus = null;
  
  // Get subscription status if authenticated
  if (isAuthenticated) {
    try {
      subscriptionStatus = await api.getSubscriptionStatus();
      // Cache subscription status
      await chrome.storage.sync.set({ 
        subscriptionStatus: subscriptionStatus 
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Try to get cached status
      const cached = await chrome.storage.sync.get(['subscriptionStatus']);
      subscriptionStatus = cached.subscriptionStatus;
    }
  }
  
  // Backend returns { plan: { id: 'pro-monthly' | 'pro-yearly' | 'free', ... }, isActive: ..., ... }
  // So we need to check subscriptionStatus.plan.id, not subscriptionStatus.subscription.plan
  const planId = subscriptionStatus?.plan?.id || null;
  const hasProPlan = planId === 'pro' || planId === 'pro-monthly' || planId === 'pro-yearly';
  
  console.log('🔍 Subscription check:', {
    hasSubscription: !!subscriptionStatus,
    planId: planId,
    hasProPlan: hasProPlan,
    subscriptionStatus: subscriptionStatus
  });
  
  return { 
    authenticated: isAuthenticated, 
    token: token,
    userEmail: userInfo.userEmail || null,
    userName: userInfo.userName || null,
    userPicture: userInfo.userPicture || null,
    subscription: subscriptionStatus || null,
    hasProPlan: hasProPlan
  };
}

// Google OAuth Sign In
async function signInWithGoogle() {
  try {
    console.log('🔐 Starting Google sign-in...');
    
    // Get OAuth2 config from manifest
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;
    
    if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      throw new Error('Google OAuth Client ID not configured. Please update manifest.json with your Client ID.');
    }
    
    // Build OAuth URL
    const redirectUrl = chrome.identity.getRedirectURL();
    const scopes = manifest.oauth2?.scopes?.join(' ') || 'openid email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `response_type=token&` +
      `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
      `scope=${encodeURIComponent(scopes)}`;
    
    console.log('🔗 Launching OAuth flow...');
    
    // Launch OAuth flow
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    });
    
    if (!responseUrl) {
      throw new Error('OAuth flow was cancelled');
    }
    
    // Extract access token from redirect URL
    const url = new URL(responseUrl);
    const fragment = url.hash.substring(1);
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    
    if (!accessToken) {
      const error = params.get('error') || 'Unknown error';
      throw new Error(`OAuth error: ${error}`);
    }
    
    console.log('✅ Got access token, verifying with Google...');
    
    // Verify token and get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }
    
    const userInfo = await userInfoResponse.json();
    console.log('✅ User info retrieved:', userInfo.email);
    
    // Send to backend for authentication
    console.log('🔄 Authenticating with backend...');
    const backendResponse = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: accessToken, // Backend expects it as idToken for chrome-extension
        platform: 'chrome-extension',
        deviceInfo: {
          sessionId: `chrome-extension-${Date.now()}`,
          platform: 'chrome-extension',
          userAgent: navigator.userAgent,
          screenResolution: 'unknown'
        }
      })
    });
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ Backend response status:', backendResponse.status);
      console.error('❌ Backend response body:', errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'Backend authentication failed' };
      }
      
      throw new Error(error.error || error.details || 'Backend authentication failed');
    }
    
    const authData = await backendResponse.json();
    console.log('✅ Backend auth response:', { 
      hasToken: !!authData.token, 
      hasUser: !!authData.user,
      userEmail: authData.user?.email 
    });
    
    if (!authData.token) {
      console.error('❌ No token in response:', authData);
      throw new Error('No token received from backend');
    }
    
    // Store tokens and user info
    await api.setToken(authData.token);
    await chrome.storage.sync.set({
      userEmail: userInfo.email,
      userName: userInfo.name,
      userPicture: userInfo.picture,
      googleAccessToken: accessToken // Store for potential future use
    });
    
    console.log('✅ Authentication successful!');
    
    return {
      success: true,
      token: authData.token,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    };
    
  } catch (error) {
    console.error('❌ Google sign-in error:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  }
}

// Sign out
async function signOut() {
  try {
    await api.clearToken();
    await chrome.storage.sync.remove(['userEmail', 'userName', 'userPicture', 'googleAccessToken']);
    console.log('✅ Signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out error:', error);
    return { success: false, error: error.message };
  }
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'checkAuth':
          const authStatus = await checkAuthStatus();
          return authStatus;
          
        case 'getSubscriptionStatus': {
          const authStatus = await checkAuthStatus();
          if (!authStatus.authenticated) {
            return { error: 'Not authenticated' };
          }
          try {
            const subscription = await api.getSubscriptionStatus();
            await chrome.storage.sync.set({ subscriptionStatus: subscription });
            return subscription;
          } catch (error) {
            return { error: error.message };
          }
        }
          
        case 'signIn':
          return await signInWithGoogle();
          
        case 'signOut':
          return await signOut();
          
        case 'saveNote': {
          const noteData = message.data;
          
          // REQUIRE authentication - block if not signed in
          const authStatus = await checkAuthStatus();
          
          if (!authStatus.authenticated) {
            return {
              success: false,
              error: 'Authentication required',
              requiresAuth: true,
              message: 'Please sign in to save notes. Sign in with Google to continue.'
            };
          }
          
          if (authStatus.authenticated) {
            // Save to backend API
            try {
              console.log('💾 Saving note to backend...', noteData.title);
              const savedNote = await api.createNote(
                noteData.title,
                noteData.content,
                noteData.summary || null
              );
              
              console.log('✅ Note saved to backend:', savedNote);
              
              // Also save a copy locally for offline access
              const localNote = {
                id: savedNote.id || `note-${Date.now()}`,
                title: savedNote.title || noteData.title,
                content: savedNote.content || noteData.content,
                summary: savedNote.summary || null,
                createdAt: savedNote.created_at || new Date().toISOString(),
                synced: true
              };
              
              const { notes = [] } = await chrome.storage.local.get(['notes']);
              // Remove any duplicate and add updated one
              const filteredNotes = notes.filter(n => n.id !== localNote.id);
              filteredNotes.push(localNote);
              await chrome.storage.local.set({ notes: filteredNotes });
              
              return { 
                success: true, 
                note: savedNote, 
                message: '✓ Note saved to your Study Buddy account!',
                synced: true
              };
            } catch (error) {
              console.error('❌ Error saving note to backend:', error);
              
              // Fallback: Save locally if backend fails
              const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const localNote = {
                id: noteId,
                title: noteData.title,
                content: noteData.content,
                summary: noteData.summary || null,
                createdAt: new Date().toISOString(),
                synced: false,
                error: error.message
              };
              
              const { notes = [] } = await chrome.storage.local.get(['notes']);
              notes.push(localNote);
              await chrome.storage.local.set({ notes });
              
              return { 
                success: false, 
                note: localNote, 
                message: `Note saved locally (failed to sync: ${error.message})`,
                synced: false,
                error: error.message
              };
            }
          }
        }
          
        case 'generateSummary':
          // REQUIRE authentication and Pro plan
          const summaryAuth = await checkAuthStatus();
          if (!summaryAuth.authenticated) {
            return { 
              error: 'Authentication required',
              requiresAuth: true,
              message: 'Please sign in to generate summaries.'
            };
          }
          if (!summaryAuth.hasProPlan) {
            return {
              error: 'Pro plan required',
              requiresProPlan: true,
              message: 'Pro plan required for AI features. Upgrade to unlock summaries.'
            };
          }
          // Generate summary from backend API
          try {
            console.log('📝 Generating summary for text length:', message.data.text?.length);
            const summaryResult = await api.generateSummary(message.data.text);
            console.log('✅ Summary result:', { 
              success: summaryResult.success, 
              hasResponse: !!summaryResult.response,
              responseLength: summaryResult.response?.length 
            });
            
            if (!summaryResult.success) {
              throw new Error(summaryResult.error || 'Failed to generate summary');
            }
            
            return { 
              summary: summaryResult.response || summaryResult.summary || 'No summary generated'
            };
          } catch (error) {
            console.error('❌ Summary generation error:', error);
            return { error: error.message || 'Failed to generate summary' };
          }
          
        case 'aiChat':
          // REQUIRE authentication and Pro plan
          const chatAuth = await checkAuthStatus();
          if (!chatAuth.authenticated) {
            return { 
              error: 'Authentication required',
              requiresAuth: true,
              response: 'Please sign in to use AI chat.'
            };
          }
          if (!chatAuth.hasProPlan) {
            return {
              error: 'Pro plan required',
              requiresProPlan: true,
              response: 'Pro plan required for AI chat. Upgrade to unlock this feature.'
            };
          }
          // Generate AI chat response from backend API
          try {
            console.log('💬 AI chat request:', message.data.question?.substring(0, 50));
            console.log('🔍 Conversation history length:', message.data.conversationHistory?.length || 0);
            console.log('📄 Selected text length:', message.data.selectedText?.length || 0);
            
            const chatResult = await api.personalizedChat(
              message.data.question, 
              message.data.conversationHistory || [],
              message.data.selectedText || null
            );
            
            console.log('📥 Full chat result:', chatResult);
            console.log('✅ Chat result check:', { 
              success: chatResult.success, 
              hasResponse: !!chatResult.response,
              responseType: typeof chatResult.response,
              responseLength: chatResult.response?.length,
              error: chatResult.error
            });
            
            // Handle error response
            if (chatResult.error) {
              console.error('❌ Backend returned error:', chatResult.error);
              throw new Error(chatResult.error);
            }
            
            // Check for success flag
            if (chatResult.success === false) {
              console.error('❌ Backend returned success: false');
              throw new Error(chatResult.error || 'Failed to get AI response');
            }
            
            // Extract response - handle different possible response formats
            let responseText = null;
            if (chatResult.response) {
              responseText = chatResult.response;
            } else if (chatResult.answer) {
              responseText = chatResult.answer;
            } else if (typeof chatResult === 'string') {
              responseText = chatResult;
            }
            
            if (!responseText) {
              console.error('❌ No response text found in result:', chatResult);
              throw new Error('No response received from AI');
            }
            
            console.log('✅ Returning response:', responseText.substring(0, 100));
            
            return { 
              response: responseText
            };
          } catch (error) {
            console.error('❌ AI chat error:', error);
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
            return { 
              error: error.message || 'Failed to get AI response',
              details: error.toString()
            };
          }
          
          
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
  console.log('✅ Study Buddy extension installed');
  console.log('🔐 Sign in with Google required to use features');
        console.log('💎 Pro plan required for AI features (Chat, Summaries)');
});


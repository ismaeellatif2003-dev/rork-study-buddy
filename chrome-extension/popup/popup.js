document.addEventListener('DOMContentLoaded', async () => {
  const authBtn = document.getElementById('auth-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  const authSection = document.getElementById('auth-section');
  const userSection = document.getElementById('user-section');
  const quickActions = document.getElementById('quick-actions');
  const instructions = document.getElementById('instructions');
  const statusDiv = document.getElementById('auth-status');
  
  // Check auth status on load
  async function updateUI() {
    const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
    
    if (response.authenticated) {
      // User is signed in
      authSection.style.display = 'none';
      userSection.style.display = 'block';
      quickActions.style.display = 'block';
      instructions.style.display = 'none';
      
      // Load user info
      const userData = await chrome.storage.sync.get(['userName', 'userEmail', 'userPicture']);
      
      if (userData.userPicture) {
        document.getElementById('user-picture').src = userData.userPicture;
      }
      document.getElementById('user-name').textContent = userData.userName || 'User';
      document.getElementById('user-email').textContent = userData.userEmail || '';
    } else {
      // User is not signed in
      authSection.style.display = 'block';
      userSection.style.display = 'none';
      quickActions.style.display = 'none';
      instructions.style.display = 'block';
      statusDiv.textContent = '';
    }
  }
  
  // Sign in button
  authBtn.addEventListener('click', async () => {
    authBtn.disabled = true;
    const originalText = authBtn.innerHTML;
    authBtn.innerHTML = '<span>Signing in...</span>';
    statusDiv.textContent = 'Authenticating with Google...';
    statusDiv.style.display = 'block';
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'signIn' });
      
      if (response.success) {
        statusDiv.textContent = '✓ Signed in successfully!';
        statusDiv.style.color = '#10b981';
        await updateUI();
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 2000);
      } else {
        throw new Error(response.error || 'Sign in failed');
      }
    } catch (error) {
      statusDiv.textContent = 'Error: ' + error.message;
      statusDiv.style.color = '#ef4444';
      authBtn.disabled = false;
      authBtn.innerHTML = originalText;
    }
  });
  
  // Sign out button
  signOutBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await chrome.runtime.sendMessage({ action: 'signOut' });
        await updateUI();
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  });
  
  // Quick actions
  document.getElementById('open-video-analyzer').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://studybuddy.global/video-analyzer' });
  });
  
  document.getElementById('open-notes').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://studybuddy.global/notes' });
  });
  
  document.getElementById('open-app').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://studybuddy.global' });
  });
  
  // Initial UI update
  await updateUI();
});


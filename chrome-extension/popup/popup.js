document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication status and update UI
  await updateAuthUI();
  
  // Load sidebar toggle state
  const { sidebarEnabled = true } = await chrome.storage.sync.get(['sidebarEnabled']);
  const sidebarToggle = document.getElementById('sidebar-toggle');
  sidebarToggle.checked = sidebarEnabled;
  
  // Handle sidebar toggle (storage-only to avoid extra permissions)
  sidebarToggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ sidebarEnabled: enabled });
    // Content script will read this on next load; no broad tab access requested
  });
  
  // Quick actions
  document.getElementById('open-app').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://studybuddy.global' });
  });
  
  // Sign in button
  document.getElementById('sign-in-btn').addEventListener('click', async () => {
    const btn = document.getElementById('sign-in-btn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'signIn' });
      
      if (response.success) {
        await updateAuthUI();
        // Show success message
        const authSection = document.getElementById('auth-section');
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = '✓ Signed in successfully!';
        successMsg.style.cssText = 'background: #10b981; color: white; padding: 8px; border-radius: 6px; margin-top: 8px; text-align: center; font-size: 12px;';
        authSection.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        alert('Sign in failed: ' + (response.error || 'Unknown error'));
        btn.disabled = false;
        btn.innerHTML = '<span>🔐 Sign in with Google</span>';
      }
    } catch (error) {
      alert('Sign in error: ' + error.message);
      btn.disabled = false;
      btn.innerHTML = '<span>🔐 Sign in with Google</span>';
    }
  });
  
  // Sign out button
  document.getElementById('sign-out-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    
    const btn = document.getElementById('sign-out-btn');
    btn.disabled = true;
    btn.textContent = 'Signing out...';
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'signOut' });
      
      if (response.success) {
        await updateAuthUI();
      } else {
        alert('Sign out failed: ' + (response.error || 'Unknown error'));
      }
      
      btn.disabled = false;
      btn.textContent = 'Sign Out';
    } catch (error) {
      alert('Sign out error: ' + error.message);
      btn.disabled = false;
      btn.textContent = 'Sign Out';
    }
  });
});

// Update authentication UI
async function updateAuthUI() {
  try {
    const authSection = document.getElementById('auth-section');
    const userInfo = document.getElementById('user-info');
    const signInPrompt = document.getElementById('sign-in-prompt');
    
    if (!authSection || !userInfo || !signInPrompt) {
      console.error('Auth UI elements not found!');
      return;
    }
    
    // Make sure auth section is visible
    authSection.style.display = 'block';
    authSection.style.visibility = 'visible';
    
    try {
      const authStatus = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      
      if (authStatus && authStatus.authenticated) {
        // Show user info
        userInfo.style.display = 'flex';
        signInPrompt.style.display = 'none';
        
        const userNameEl = document.getElementById('user-name');
        const userEmailEl = document.getElementById('user-email');
        
        if (userNameEl) userNameEl.textContent = authStatus.userName || 'User';
        if (userEmailEl) userEmailEl.textContent = authStatus.userEmail || '';
        
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
          if (authStatus.userPicture) {
            avatarEl.src = authStatus.userPicture;
            avatarEl.style.display = 'block';
          } else {
            avatarEl.style.display = 'none';
          }
        }
        
        // Update subscription status display
        updateSubscriptionStatus(authStatus);
      } else {
        // Show sign in prompt - REQUIRED
        userInfo.style.display = 'none';
        signInPrompt.style.display = 'block';
        authSection.style.display = 'block';
      }
    } catch (msgError) {
      console.error('Error checking auth status:', msgError);
      // Show sign in prompt on error
      userInfo.style.display = 'none';
      signInPrompt.style.display = 'block';
      authSection.style.display = 'block';
    }
  } catch (error) {
    console.error('Critical error in updateAuthUI:', error);
    // Fallback: show sign-in prompt
    const authSection = document.getElementById('auth-section');
    const signInPrompt = document.getElementById('sign-in-prompt');
    if (authSection) authSection.style.display = 'block';
    if (signInPrompt) signInPrompt.style.display = 'block';
  }
}

// Update subscription status in UI
function updateSubscriptionStatus(authStatus) {
  const userNameEl = document.getElementById('user-name');
  if (!userNameEl) return;
  
  const planBadge = document.getElementById('plan-badge') || createPlanBadge();
  const currentText = userNameEl.textContent.split(' • ')[0];
  
  if (authStatus.hasProPlan) {
    planBadge.textContent = '✓ Pro';
    planBadge.className = 'plan-badge plan-pro';
    userNameEl.innerHTML = `${currentText} • ${planBadge.outerHTML}`;
  } else {
    planBadge.textContent = 'Free';
    planBadge.className = 'plan-badge plan-free';
    userNameEl.innerHTML = `${currentText} • ${planBadge.outerHTML}`;
    
    // Add upgrade button if not already present
    addUpgradeButton();
  }
}

function createPlanBadge() {
  const badge = document.createElement('span');
  badge.id = 'plan-badge';
  badge.className = 'plan-badge';
  return badge;
}

function addUpgradeButton() {
  // Remove existing upgrade button if any
  const existing = document.getElementById('upgrade-btn');
  if (existing) return;
  
  const userInfoDiv = document.getElementById('user-info');
  const upgradeBtn = document.createElement('button');
  upgradeBtn.id = 'upgrade-btn';
  upgradeBtn.className = 'upgrade-btn';
  upgradeBtn.textContent = '⬆️ Upgrade to Pro';
  upgradeBtn.style.cssText = 'margin-top: 8px; width: 100%; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;';
  
  upgradeBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://studybuddy.global/subscription' });
  });
  
  userInfoDiv.appendChild(upgradeBtn);
}


// Inject sidebar UI into page
function createSidebarUI() {
  const sidebar = document.createElement('div');
  sidebar.id = 'study-buddy-sidebar';
  sidebar.innerHTML = `
    <div class="sb-resize-handle" id="sb-resize-handle" title="Drag to resize sidebar"></div>
    <div class="sb-sidebar-container">
      <div class="sb-sidebar-header">
        <h3>📚 Study Buddy</h3>
        <div class="sb-header-actions">
          <button id="sb-quick-save-btn" class="sb-quick-save-btn" title="Quick Save Selected Text">
            💾 Save
          </button>
          <button id="sb-toggle-btn" class="sb-toggle-btn" title="Toggle sidebar">◄</button>
        </div>
      </div>
      <div class="sb-sidebar-tabs">
        <button class="sb-tab active" data-tab="notes">Notes</button>
        <button class="sb-tab" data-tab="chat">AI Chat</button>
        <button class="sb-tab" data-tab="video">Video</button>
      </div>
            <div class="sb-sidebar-content">
              <!-- Notes Tab -->
              <div id="sb-notes-tab" class="sb-tab-content active">
                <div id="sb-auth-required-message" class="sb-auth-required-message" style="display: none;">
                  <div class="sb-auth-banner">
                    <strong>🔐 Sign In Required</strong>
                    <p>Please sign in with Google to use Study Buddy. Click the extension icon → Sign in.</p>
                  </div>
                </div>
                <div id="sb-free-plan-message" class="sb-free-plan-message" style="display: none;">
                  <div class="sb-upgrade-banner">
                    <strong>⬆️ Upgrade to Pro</strong>
                    <p>Unlock AI features like summaries, chat, and video analysis.</p>
                    <button id="sb-sidebar-upgrade-btn" class="sb-btn sb-btn-primary" style="margin-top: 8px; width: 100%;">Upgrade Now</button>
                  </div>
                </div>
                <div class="sb-selected-text">
                  <label>Selected Text (Live):</label>
                  <div id="sb-selected-text-display" class="sb-selected-text-display">No text selected. Highlight text on the page to see it here.</div>
                </div>
                <input type="text" id="sb-note-title" placeholder="Note Title" class="sb-input">
                <textarea id="sb-note-content" placeholder="Note content (selected text is auto-filled)" class="sb-textarea" rows="6"></textarea>
                <div class="sb-actions">
                  <button id="sb-generate-summary-btn" class="sb-btn sb-btn-secondary">Generate Summary</button>
                  <button id="sb-save-note-btn" class="sb-btn sb-btn-primary">Save Note</button>
                </div>
                <!-- Summary Display Area -->
                <div id="sb-summary-container" class="sb-summary-container" style="display: none;">
                  <div class="sb-summary-header">
                    <label>📝 Generated Summary:</label>
                    <div class="sb-summary-actions">
                      <button id="sb-copy-summary-btn" class="sb-btn-icon" title="Copy summary">📋</button>
                      <button id="sb-use-summary-btn" class="sb-btn-icon" title="Use as note content">✓</button>
                      <button id="sb-close-summary-btn" class="sb-btn-icon" title="Close">✕</button>
                    </div>
                  </div>
                  <div id="sb-summary-display" class="sb-summary-display"></div>
                </div>
              </div>

        <!-- AI Chat Tab -->
        <div id="sb-chat-tab" class="sb-tab-content">
          <div id="sb-chat-messages" class="sb-chat-messages"></div>
          <div class="sb-chat-input-container">
            <textarea id="sb-chat-input" placeholder="Ask about the selected text..." class="sb-textarea" rows="3"></textarea>
            <button id="sb-send-chat-btn" class="sb-btn sb-btn-primary">Send</button>
          </div>
        </div>

        <!-- Video Tab -->
        <div id="sb-video-tab" class="sb-tab-content">
          <label>YouTube URL:</label>
          <input type="text" id="sb-video-url" placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)" class="sb-input">
          <button id="sb-analyze-video-btn" class="sb-btn sb-btn-primary">Analyze Video</button>
          <div id="sb-video-status" class="sb-status"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(sidebar);
  return sidebar;
}

// Initialize sidebar on page load
let selectedText = '';
let sidebar = null;
let sidebarCollapsed = false;
let sidebarEnabled = true; // Default to enabled
let sidebarWidth = 380; // Default width in pixels
let isResizing = false;

// Check if sidebar should be enabled and initialize
async function checkAndInitSidebar() {
  try {
    const result = await chrome.storage.sync.get(['sidebarEnabled', 'sidebarWidth']);
    sidebarEnabled = result.sidebarEnabled !== false; // Default to true if not set
    sidebarWidth = result.sidebarWidth || 380; // Default to 380px if not set
    
    console.log('🔍 Sidebar enabled:', sidebarEnabled, 'Width:', sidebarWidth);
    
    if (sidebarEnabled) {
      // Give page a moment to load
      setTimeout(() => {
        initSidebar();
      }, 100);
    }
  } catch (error) {
    console.error('❌ Error checking sidebar state:', error);
    // Default to enabled if there's an error
    sidebarEnabled = true;
    sidebarWidth = 380;
    setTimeout(() => {
      initSidebar();
    }, 100);
  }
}

// Create sidebar on page load
function initSidebar() {
  // Check if sidebar already exists
  const existingSidebar = document.getElementById('study-buddy-sidebar');
  if (existingSidebar) {
    sidebar = existingSidebar;
    console.log('✅ Found existing sidebar');
    return;
  }
  
  if (!sidebar && sidebarEnabled) {
    console.log('🚀 Creating new sidebar...');
    sidebar = createSidebarUI();
    
    if (!sidebar) {
      console.error('❌ Failed to create sidebar');
      return;
    }
    
    // Ensure sidebar is always visible
    sidebar.style.display = 'flex';
    sidebar.style.visibility = 'visible';
    sidebar.style.opacity = '1';
    sidebar.classList.remove('sb-hidden');
    
    console.log('✅ Sidebar created, setting up...');
    
    // Setup event listeners
    try {
      setupSidebarEventListeners(sidebar);
    } catch (e) {
      console.error('❌ Error setting up event listeners:', e);
    }
    
    // Wait a bit for DOM to be ready before setting up resize
    setTimeout(() => {
      try {
        setupResizeHandle(sidebar);
      } catch (e) {
        console.error('❌ Error setting up resize handle:', e);
      }
    }, 200);
    
          updateSelectedTextDisplay(''); // Initialize with empty state
          setSidebarWidth(sidebarWidth); // Set saved width
          adjustBodyMargin(); // Adjust page margin to account for sidebar
          
          // Check auth status and update UI
          chrome.runtime.sendMessage({ action: 'checkAuth' }).then(authStatus => {
            updateSidebarAuthStatus(authStatus);
          }).catch(err => {
            console.error('Error checking auth on init:', err);
          });
          
          console.log('✅ Sidebar fully initialized and visible');
    console.log('📍 Sidebar element:', sidebar);
    console.log('📐 Sidebar width:', sidebarWidth);
  } else {
    console.log('⚠️ Sidebar not created - sidebar:', !!sidebar, 'enabled:', sidebarEnabled);
  }
}

// Set sidebar width and save to storage
function setSidebarWidth(width) {
  if (!sidebar) {
    console.error('Cannot set width - sidebar not found');
    return;
  }
  
  // Clamp width between min and max
  const minWidth = 250;
  const maxWidth = 800;
  sidebarWidth = Math.max(minWidth, Math.min(maxWidth, width));
  
  sidebar.style.setProperty('width', `${sidebarWidth}px`, 'important');
  
  // Save to storage
  chrome.storage.sync.set({ sidebarWidth: sidebarWidth });
  
  adjustBodyMargin();
  
  console.log('📐 Sidebar width set to:', sidebarWidth, 'px');
}

// Setup resize handle functionality
function setupResizeHandle(sidebar) {
  if (!sidebar) {
    console.error('Sidebar not found for resize setup');
    return;
  }
  
  const resizeHandle = document.getElementById('sb-resize-handle');
  if (!resizeHandle) {
    console.error('❌ Resize handle element not found');
    // Try to find it again after a delay
    setTimeout(() => {
      const retryHandle = document.getElementById('sb-resize-handle');
      if (retryHandle) {
        console.log('✅ Found resize handle on retry');
        attachResizeListeners(retryHandle);
      } else {
        console.error('❌ Resize handle still not found after retry');
      }
    }, 200);
    return;
  }
  
  console.log('✅ Resize handle found, attaching listeners');
  attachResizeListeners(resizeHandle);
}

function attachResizeListeners(resizeHandle) {
  // Remove any existing listeners by cloning
  const newHandle = resizeHandle.cloneNode(true);
  resizeHandle.parentNode.replaceChild(newHandle, resizeHandle);
  
  newHandle.addEventListener('mousedown', startResize, { passive: false });
  newHandle.addEventListener('touchstart', handleTouchResize, { passive: false });
  
  // Visual feedback
  newHandle.addEventListener('mouseenter', () => {
    newHandle.style.cursor = 'ew-resize';
  });
}

function startResize(e) {
  e.preventDefault();
  e.stopPropagation();
  
  isResizing = true;
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
  
  const startX = e.clientX;
  const startWidth = sidebarWidth;
  
  console.log('🔄 Starting resize - Current width:', startWidth);
  
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate new width - dragging left (negative deltaX) makes sidebar wider
    const deltaX = startX - e.clientX;
    const newWidth = startWidth + deltaX;
    
    if (Math.abs(deltaX) > 1) { // Only update if moved more than 1px
      setSidebarWidth(newWidth);
      console.log('📏 Resizing to:', newWidth, 'px');
    }
  };
  
  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    console.log('✅ Resize complete - Final width:', sidebarWidth);
  };
  
  const handleTouchMove = (e) => {
    if (!isResizing || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = startX - touch.clientX;
    const newWidth = startWidth + deltaX;
    if (Math.abs(deltaX) > 1) {
      setSidebarWidth(newWidth);
    }
  };
  
  const handleTouchEnd = (e) => {
    e.preventDefault();
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
  
  document.addEventListener('mousemove', handleMouseMove, { passive: false });
  document.addEventListener('mouseup', handleMouseUp, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleTouchResize(e) {
  if (e.touches.length !== 1) return;
  e.preventDefault();
  isResizing = true;
  const touch = e.touches[0];
  const startX = touch.clientX;
  const startWidth = sidebarWidth;
  
  const handleTouchMove = (e) => {
    if (!isResizing || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = startX - touch.clientX;
    const newWidth = startWidth + deltaX;
    if (Math.abs(deltaX) > 1) {
      setSidebarWidth(newWidth);
    }
  };
  
  const handleTouchEnd = () => {
    isResizing = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
}

// Hide sidebar completely
function hideSidebar() {
  if (sidebar) {
    sidebar.classList.add('sb-hidden');
    document.body.style.marginRight = '0px';
  }
}

// Show sidebar
function showSidebar() {
  if (sidebar) {
    sidebar.classList.remove('sb-hidden');
    sidebar.style.display = 'flex';
    sidebar.style.visibility = 'visible';
    adjustBodyMargin();
    
    // Re-setup resize handle if needed
    if (!document.getElementById('sb-resize-handle')) {
      setTimeout(() => setupResizeHandle(sidebar), 100);
    }
  } else if (sidebarEnabled) {
    initSidebar();
  }
}

// Update selected text in real-time as user highlights text
document.addEventListener('mouseup', async (e) => {
  if (!sidebarEnabled) return;
  
  // Don't interfere with resizing
  if (isResizing) return;
  
  // Don't update if clicking inside the sidebar
  if (sidebar && sidebar.contains(e.target)) return;
  
      // Check if user is authenticated before showing sidebar content
      try {
        const authStatus = await chrome.runtime.sendMessage({ action: 'checkAuth' });
        updateSidebarAuthStatus(authStatus);
        if (!authStatus.authenticated) {
          // Sidebar still visible but show sign-in message
          updateSelectedTextDisplay('');
          const noteContent = document.getElementById('sb-note-content');
          if (noteContent) {
            noteContent.value = '';
            noteContent.placeholder = 'Please sign in to capture notes. Click extension icon → Sign in with Google';
          }
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
  
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (text.length > 0) {
    selectedText = text;
    updateSelectedTextDisplay(text);
    
    // Auto-fill note content if it's empty or matches previous selection
    const noteContent = document.getElementById('sb-note-content');
    if (noteContent && (!noteContent.value || noteContent.value === selectedText)) {
      noteContent.value = selectedText;
    }
    
    // Update chat placeholder
    const chatInput = document.getElementById('sb-chat-input');
    if (chatInput) {
      chatInput.placeholder = `Ask about: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`;
    }
  } else {
    // Keep last selection visible even if nothing is currently selected
    // This allows users to see what was captured
  }
});

function updateSelectedTextDisplay(text) {
  const displayEl = document.getElementById('sb-selected-text-display');
  if (!displayEl) return;
  
  if (!text || text.length === 0) {
    displayEl.textContent = 'No text selected. Highlight text on the page to see it here.';
    displayEl.classList.add('sb-empty-state');
  } else {
    displayEl.textContent = text;
    displayEl.classList.remove('sb-empty-state');
    // Auto-scroll to show the selected text
    displayEl.scrollTop = 0;
  }
}

function toggleSidebar() {
  if (!sidebar) return;
  
  sidebarCollapsed = !sidebarCollapsed;
  sidebar.classList.toggle('sb-collapsed', sidebarCollapsed);
  
  const toggleBtn = document.getElementById('sb-toggle-btn');
  if (toggleBtn) {
    toggleBtn.textContent = sidebarCollapsed ? '►' : '◄';
    toggleBtn.title = sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  }
  
  // Adjust body margin when sidebar is toggled
  adjustBodyMargin();
}

function adjustBodyMargin() {
  if (!sidebar) return;
  
  const currentWidth = sidebarCollapsed ? 50 : sidebarWidth;
  document.body.style.marginRight = `${currentWidth}px`;
}

// Check authentication before allowing actions
async function checkAuthBeforeAction(requireProPlan = false) {
  try {
    const authStatus = await chrome.runtime.sendMessage({ action: 'checkAuth' });
    
    if (!authStatus.authenticated) {
      alert('Please sign in with Google to use this feature.\n\nClick the extension icon and sign in.');
      // Optionally open popup
      chrome.runtime.sendMessage({ action: 'openPopup' }).catch(() => {});
      return false;
    }
    
    if (requireProPlan && !authStatus.hasProPlan) {
      const upgrade = confirm('This feature requires a Pro plan.\n\nWould you like to upgrade now?');
      if (upgrade) {
        chrome.tabs.create({ url: 'https://studybuddy.global/subscription' });
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    alert('Unable to verify authentication. Please try again.');
    return false;
  }
}

function setupSidebarEventListeners(sidebar) {
  // Toggle button
  document.getElementById('sb-toggle-btn').addEventListener('click', toggleSidebar);
  
  // Quick Save button - saves selected text instantly
  document.getElementById('sb-quick-save-btn').addEventListener('click', async () => {
    if (!(await checkAuthBeforeAction())) return;
    
    // Get selected text or note content
    const selectedTextDisplay = document.getElementById('sb-selected-text-display');
    const noteContent = document.getElementById('sb-note-content');
    const noteTitle = document.getElementById('sb-note-title');
    
    let content = '';
    let title = '';
    
    // Priority: use note content if available, otherwise use selected text
    if (noteContent && noteContent.value.trim()) {
      content = noteContent.value;
      title = noteTitle ? noteTitle.value : '';
    } else if (selectedText && selectedText.trim()) {
      content = selectedText;
      title = `Research Note - ${new Date().toLocaleDateString()}`;
    } else {
      alert('No content to save. Please select text on the page or enter note content.');
      return;
    }
    
    if (!title) {
      title = 'Untitled Note';
    }
    
    const quickSaveBtn = document.getElementById('sb-quick-save-btn');
    const originalText = quickSaveBtn.textContent;
    quickSaveBtn.disabled = true;
    quickSaveBtn.textContent = '💾 Saving...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveNote',
        data: { title, content }
      });
      
      if (response.error) {
        if (response.requiresAuth) {
          alert('Please sign in to save notes.\n\nClick the extension icon to sign in with Google.');
          chrome.runtime.sendMessage({ action: 'openPopup' }).catch(() => {});
        } else {
          throw new Error(response.error);
        }
        quickSaveBtn.textContent = originalText;
        quickSaveBtn.disabled = false;
        return;
      }
      
      // Show success feedback
      if (response.synced) {
        quickSaveBtn.textContent = '✓ Synced!';
        quickSaveBtn.style.background = '#10b981';
        quickSaveBtn.style.color = 'white';
      } else {
        quickSaveBtn.textContent = '⚠️ Error';
        quickSaveBtn.style.background = '#ef4444';
        quickSaveBtn.style.color = 'white';
      }
      
      setTimeout(() => {
        quickSaveBtn.textContent = originalText;
        quickSaveBtn.style.background = '';
        quickSaveBtn.style.color = '';
        quickSaveBtn.disabled = false;
      }, 3000);
      
      // Optionally clear the form after saving
      // Uncomment if you want to clear after quick save:
      // if (noteContent) noteContent.value = '';
      // if (noteTitle) noteTitle.value = '';
      // selectedText = '';
      // updateSelectedTextDisplay('');
    } catch (error) {
      alert('Failed to save note: ' + error.message);
      quickSaveBtn.textContent = originalText;
      quickSaveBtn.style.background = '';
      quickSaveBtn.style.color = '';
      quickSaveBtn.disabled = false;
    }
  });
  
  // Tab switching
  document.querySelectorAll('.sb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sb-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sb-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`sb-${tab.dataset.tab}-tab`).classList.add('active');
    });
  });
  
  // Save Note (full form save)
  document.getElementById('sb-save-note-btn').addEventListener('click', async () => {
    if (!(await checkAuthBeforeAction())) return;
    
    const title = document.getElementById('sb-note-title').value || 'Untitled Note';
    const content = document.getElementById('sb-note-content').value;
    
    if (!content.trim()) {
      alert('Please enter note content');
      return;
    }
    
    const saveBtn = document.getElementById('sb-save-note-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveNote',
        data: { title, content }
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Show appropriate message based on sync status
      if (response.synced) {
        alert('✓ Note saved to your Study Buddy account!');
      } else if (response.requiresAuth) {
        alert('Note saved locally. Sign in to sync with your account.');
      } else {
        alert(response.message || 'Note saved locally (sync failed)');
      }
      
      // Clear form after saving
      document.getElementById('sb-note-title').value = '';
      document.getElementById('sb-note-content').value = '';
      selectedText = '';
      updateSelectedTextDisplay('');
    } catch (error) {
      alert('Failed to save note: ' + error.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Note';
    }
  });
  
        // Generate Summary (requires Pro plan)
        document.getElementById('sb-generate-summary-btn').addEventListener('click', async () => {
          if (!(await checkAuthBeforeAction(true))) return; // true = requires Pro plan
    
    const content = document.getElementById('sb-note-content').value;
    if (!content.trim()) {
      alert('Please enter note content first');
      return;
    }
    
    const btn = document.getElementById('sb-generate-summary-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateSummary',
        data: { text: content }
      });
      
          if (response.error) {
            if (response.requiresProPlan) {
              const upgrade = confirm('Generate Summary requires a Pro plan.\n\nWould you like to upgrade now?');
              if (upgrade) {
                chrome.tabs.create({ url: 'https://studybuddy.global/subscription' });
              }
            } else {
              throw new Error(response.error);
            }
            return;
          }
          
          if (response.summary) {
            // Display summary in the summary container
            const summaryContainer = document.getElementById('sb-summary-container');
            const summaryDisplay = document.getElementById('sb-summary-display');
            
            if (summaryContainer && summaryDisplay) {
              summaryDisplay.textContent = response.summary;
              summaryContainer.style.display = 'block';
              
              // Scroll to summary
              summaryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
              // Fallback: Add summary to note content if container not found
              const currentContent = document.getElementById('sb-note-content').value;
              document.getElementById('sb-note-content').value = currentContent + `\n\n--- Summary ---\n${response.summary}`;
            }
          } else {
            alert('No summary was generated. Please try again.');
          }
        } catch (error) {
          alert('Failed to generate summary: ' + error.message);
        } finally {
          btn.disabled = false;
          btn.textContent = 'Generate Summary';
        }
      });
      
      // Copy Summary button
      document.getElementById('sb-copy-summary-btn').addEventListener('click', () => {
        const summaryDisplay = document.getElementById('sb-summary-display');
        if (summaryDisplay && summaryDisplay.textContent) {
          navigator.clipboard.writeText(summaryDisplay.textContent).then(() => {
            const btn = document.getElementById('sb-copy-summary-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓';
            btn.style.color = '#10b981';
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.color = '';
            }, 2000);
          }).catch(err => {
            alert('Failed to copy summary: ' + err.message);
          });
        }
      });
      
      // Use Summary button - adds summary to note content
      document.getElementById('sb-use-summary-btn').addEventListener('click', () => {
        const summaryDisplay = document.getElementById('sb-summary-display');
        const noteContent = document.getElementById('sb-note-content');
        if (summaryDisplay && summaryDisplay.textContent && noteContent) {
          const currentContent = noteContent.value;
          const separator = currentContent.trim() ? '\n\n' : '';
          noteContent.value = currentContent + separator + summaryDisplay.textContent;
          
          // Show feedback
          const btn = document.getElementById('sb-use-summary-btn');
          const originalText = btn.textContent;
          btn.textContent = '✓';
          btn.style.color = '#10b981';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
          }, 2000);
        }
      });
      
      // Close Summary button
      document.getElementById('sb-close-summary-btn').addEventListener('click', () => {
        const summaryContainer = document.getElementById('sb-summary-container');
        if (summaryContainer) {
          summaryContainer.style.display = 'none';
        }
      });
      
      // AI Chat (requires Pro plan)
      document.getElementById('sb-send-chat-btn').addEventListener('click', async () => {
        if (!(await checkAuthBeforeAction(true))) return; // true = requires Pro plan
    
    const question = document.getElementById('sb-chat-input').value;
    if (!question.trim()) {
      return;
    }
    
    // Add user message
    addChatMessage('user', question);
    document.getElementById('sb-chat-input').value = '';
    
    const sendBtn = document.getElementById('sb-send-chat-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Thinking...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'aiChat',
        data: { 
          question,
          selectedText: selectedText,
          conversationHistory: []
        }
      });
      
          if (response.error) {
            if (response.requiresProPlan) {
              const upgrade = confirm('AI Chat requires a Pro plan.\n\nWould you like to upgrade now?');
              if (upgrade) {
                chrome.tabs.create({ url: 'https://studybuddy.global/subscription' });
              }
              addChatMessage('error', 'Pro plan required for AI chat. Upgrade to unlock this feature.');
            } else if (response.requiresAuth) {
              addChatMessage('error', 'Please sign in to use AI chat.');
              alert('Please sign in to use AI chat.\n\nClick the extension icon to sign in.');
            } else {
              throw new Error(response.error);
            }
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
            return;
          }
          
          if (response.response) {
            addChatMessage('assistant', response.response);
          } else if (response.error) {
            // Show error as chat message
            addChatMessage('error', `Error: ${response.error}${response.details ? '\n' + response.details : ''}`);
          } else {
            console.error('Unexpected response format:', response);
            addChatMessage('error', 'No response received from AI. Please try again.');
          }
        } catch (error) {
          console.error('Chat error:', error);
          addChatMessage('error', 'Failed to get AI response: ' + error.message);
        } finally {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
        }
      });
      
      // Allow Enter key to send message (Shift+Enter for new line)
      document.getElementById('sb-chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          document.getElementById('sb-send-chat-btn').click();
        }
      });
      
      // Video Analysis (requires Pro plan)
      document.getElementById('sb-analyze-video-btn').addEventListener('click', async () => {
        if (!(await checkAuthBeforeAction(true))) return; // true = requires Pro plan
    
    const url = document.getElementById('sb-video-url').value.trim();
    if (!url) {
      alert('Please enter a YouTube URL');
      return;
    }
    
    const statusDiv = document.getElementById('sb-video-status');
    const analyzeBtn = document.getElementById('sb-analyze-video-btn');
    
    statusDiv.textContent = 'Starting analysis...';
    analyzeBtn.disabled = true;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeVideo',
        data: { url }
      });
      
          if (response.error) {
            if (response.requiresProPlan) {
              const upgrade = confirm('Video Analysis requires a Pro plan.\n\nWould you like to upgrade now?');
              if (upgrade) {
                chrome.tabs.create({ url: 'https://studybuddy.global/subscription' });
              }
              statusDiv.textContent = 'Pro plan required. Upgrade to unlock video analysis.';
            } else if (response.requiresAuth) {
              statusDiv.textContent = 'Please sign in to analyze videos.';
              alert('Please sign in to analyze videos.\n\nClick the extension icon to sign in.');
            } else {
              statusDiv.textContent = 'Error: ' + response.error;
            }
            return;
          }
          
          statusDiv.textContent = `✓ Analysis started! ID: ${response.id}. Check your Study Buddy account for results.`;
          document.getElementById('sb-video-url').value = '';
        } catch (error) {
          statusDiv.textContent = 'Error: ' + error.message;
        } finally {
          analyzeBtn.disabled = false;
        }
      });
}

function addChatMessage(role, message) {
  const messagesDiv = document.getElementById('sb-chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `sb-chat-message sb-chat-message-${role}`;
  messageDiv.textContent = message;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Update sidebar auth status display
function updateSidebarAuthStatus(authStatus) {
  const authRequiredMsg = document.getElementById('sb-auth-required-message');
  const freePlanMsg = document.getElementById('sb-free-plan-message');
  const upgradeBtn = document.getElementById('sb-sidebar-upgrade-btn');
  
  if (!authStatus.authenticated) {
    // Show sign-in required message
    if (authRequiredMsg) authRequiredMsg.style.display = 'block';
    if (freePlanMsg) freePlanMsg.style.display = 'none';
    
    // Disable action buttons
    const saveBtn = document.getElementById('sb-save-note-btn');
    const generateBtn = document.getElementById('sb-generate-summary-btn');
    if (saveBtn) saveBtn.disabled = true;
    if (generateBtn) generateBtn.disabled = true;
  } else {
    // Hide sign-in message
    if (authRequiredMsg) authRequiredMsg.style.display = 'none';
    
    // Show upgrade message if on free plan
    if (!authStatus.hasProPlan) {
      if (freePlanMsg) freePlanMsg.style.display = 'block';
      if (upgradeBtn) {
        upgradeBtn.onclick = () => {
          chrome.tabs.create({ url: 'https://studybuddy.global/subscription' });
        };
      }
    } else {
      if (freePlanMsg) freePlanMsg.style.display = 'none';
    }
    
    // Enable action buttons
    const saveBtn = document.getElementById('sb-save-note-btn');
    const generateBtn = document.getElementById('sb-generate-summary-btn');
    if (saveBtn) saveBtn.disabled = false;
    if (generateBtn) generateBtn.disabled = false;
  }
}

// Initialize sidebar when page loads (only if enabled)
console.log('📄 Content script loaded, readyState:', document.readyState);

// Try multiple initialization methods to ensure it works
function initializeSidebar() {
  console.log('🔄 Attempting sidebar initialization...');
  checkAndInitSidebar();
}

// Initialize immediately if DOM is ready
if (document.readyState === 'loading') {
  console.log('⏳ Waiting for DOM to load...');
  document.addEventListener('DOMContentLoaded', initializeSidebar);
} else {
  console.log('✅ DOM already loaded, initializing now...');
  initializeSidebar();
}

// Also try after a short delay as fallback
setTimeout(() => {
  if (!document.getElementById('study-buddy-sidebar')) {
    console.log('🔄 Retry initialization after delay...');
    checkAndInitSidebar();
  }
}, 500);

// Listen for messages to toggle sidebar on/off
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleSidebar') {
    sidebarEnabled = message.enabled;
    
    if (sidebarEnabled) {
      showSidebar();
    } else {
      hideSidebar();
    }
    
    sendResponse({ success: true });
  }
});

// Adjust body margin on window resize
window.addEventListener('resize', () => {
  if (sidebar && sidebarEnabled) {
    adjustBodyMargin();
  }
});


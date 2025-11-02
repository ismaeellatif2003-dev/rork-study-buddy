// Inject popup UI into page
function createPopupUI() {
  const popup = document.createElement('div');
  popup.id = 'study-buddy-popup';
  popup.innerHTML = `
    <div class="sb-popup-container">
      <div class="sb-popup-header">
        <h3>📚 Study Buddy</h3>
        <button id="sb-close-btn" class="sb-close-btn">×</button>
      </div>
      <div class="sb-popup-tabs">
        <button class="sb-tab active" data-tab="notes">Notes</button>
        <button class="sb-tab" data-tab="chat">AI Chat</button>
        <button class="sb-tab" data-tab="video">Video</button>
      </div>
      <div class="sb-popup-content">
        <!-- Notes Tab -->
        <div id="sb-notes-tab" class="sb-tab-content active">
          <div class="sb-selected-text">
            <label>Selected Text:</label>
            <p id="sb-selected-text-display"></p>
          </div>
          <input type="text" id="sb-note-title" placeholder="Note Title" class="sb-input">
          <textarea id="sb-note-content" placeholder="Note content (selected text is auto-filled)" class="sb-textarea" rows="4"></textarea>
          <div class="sb-actions">
            <button id="sb-generate-summary-btn" class="sb-btn sb-btn-secondary">Generate Summary</button>
            <button id="sb-save-note-btn" class="sb-btn sb-btn-primary">Save Note</button>
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
  
  document.body.appendChild(popup);
  return popup;
}

// Show popup when text is selected
let selectedText = '';
let popupVisible = false;

document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (text.length > 0 && !popupVisible) {
    selectedText = text;
    showPopup(e.pageX, e.pageY);
  }
});

function showPopup(x, y) {
  let popup = document.getElementById('study-buddy-popup');
  
  if (!popup) {
    popup = createPopupUI();
    setupPopupEventListeners(popup);
  }
  
  // Position popup near cursor
  popup.style.left = `${Math.min(x, window.innerWidth - 420)}px`;
  popup.style.top = `${Math.min(y + 20, window.innerHeight - 500)}px`;
  popup.style.display = 'block';
  popupVisible = true;
  
  // Auto-fill selected text
  const displayText = selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText;
  document.getElementById('sb-selected-text-display').textContent = displayText;
  document.getElementById('sb-note-content').value = selectedText;
  document.getElementById('sb-chat-input').placeholder = `Ask about: "${selectedText.substring(0, 50)}..."`;
  
  // Close popup when clicking outside
  setTimeout(() => {
    document.addEventListener('click', closePopupOnOutsideClick, true);
  }, 100);
}

function closePopupOnOutsideClick(e) {
  const popup = document.getElementById('study-buddy-popup');
  if (popup && !popup.contains(e.target)) {
    closePopup();
    document.removeEventListener('click', closePopupOnOutsideClick, true);
  }
}

function closePopup() {
  const popup = document.getElementById('study-buddy-popup');
  if (popup) {
    popup.style.display = 'none';
    popupVisible = false;
  }
}

// Check auth before action
async function checkAuthBeforeAction() {
  const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
  if (!response.authenticated) {
    alert('Please sign in to Study Buddy first. Click the extension icon to sign in.');
    return false;
  }
  return true;
}

function setupPopupEventListeners(popup) {
  // Close button
  document.getElementById('sb-close-btn').addEventListener('click', closePopup);
  
  // Tab switching
  document.querySelectorAll('.sb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sb-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sb-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`sb-${tab.dataset.tab}-tab`).classList.add('active');
    });
  });
  
  // Save Note
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
      
      alert('✓ Note saved successfully! View it at studybuddy.global/notes');
      closePopup();
    } catch (error) {
      alert('Failed to save note: ' + error.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Note';
    }
  });
  
  // Generate Summary
  document.getElementById('sb-generate-summary-btn').addEventListener('click', async () => {
    if (!(await checkAuthBeforeAction())) return;
    
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
        throw new Error(response.error);
      }
      
      if (response.summary) {
        // Add summary to note content
        const currentContent = document.getElementById('sb-note-content').value;
        document.getElementById('sb-note-content').value = currentContent + `\n\n--- Summary ---\n${response.summary}`;
      }
    } catch (error) {
      alert('Failed to generate summary: ' + error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate Summary';
    }
  });
  
  // AI Chat
  document.getElementById('sb-send-chat-btn').addEventListener('click', async () => {
    if (!(await checkAuthBeforeAction())) return;
    
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
        throw new Error(response.error);
      }
      
      addChatMessage('assistant', response.response);
    } catch (error) {
      addChatMessage('error', 'Failed to get AI response: ' + error.message);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    }
  });
  
  // Video Analysis
  document.getElementById('sb-analyze-video-btn').addEventListener('click', async () => {
    if (!(await checkAuthBeforeAction())) return;
    
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
        throw new Error(response.error);
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

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showPopup') {
    showPopup(message.x, message.y);
  }
});


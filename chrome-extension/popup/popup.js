document.addEventListener('DOMContentLoaded', async () => {
  // Quick actions
  document.getElementById('open-app').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://studybuddy.global' });
  });
  
  // View local notes
  document.getElementById('view-local-notes').addEventListener('click', async () => {
    const notesSection = document.getElementById('local-notes');
    const notesList = document.getElementById('notes-list');
    
    if (notesSection.style.display === 'none') {
      // Load and display notes
      const { notes = [] } = await chrome.storage.local.get(['notes']);
      
      if (notes.length === 0) {
        notesList.innerHTML = '<p style="color: #6b7280; padding: 12px; text-align: center;">No notes saved yet. Select text on a webpage to create notes!</p>';
      } else {
        notesList.innerHTML = notes.map((note, index) => `
          <div class="note-item">
            <div class="note-title">${note.title || 'Untitled'}</div>
            <div class="note-content">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
            <div class="note-date">${new Date(note.createdAt).toLocaleDateString()}</div>
            <button class="note-delete-btn" data-index="${index}">Delete</button>
          </div>
        `).join('');
        
        // Add delete handlers
        notesList.querySelectorAll('.note-delete-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const index = parseInt(btn.dataset.index);
            const { notes = [] } = await chrome.storage.local.get(['notes']);
            notes.splice(index, 1);
            await chrome.storage.local.set({ notes });
            // Refresh list
            document.getElementById('view-local-notes').click();
          });
        });
      }
      
      notesSection.style.display = 'block';
    } else {
      notesSection.style.display = 'none';
    }
  });
});


# Study Buddy Chrome Extension

Chrome extension for Study Buddy that allows users to capture notes, use AI chat, and analyze videos from any webpage.

## Features

- 📝 **Capture Notes**: Select text on any webpage and save it as a note
- 🤖 **AI Chat**: Ask questions about selected text with personalized AI responses
- 📹 **Video Analysis**: Analyze YouTube videos by pasting the URL
- 📊 **Auto-Summarize**: Automatically generate summaries for captured notes
- 🔄 **Account Sync**: All notes sync with your Study Buddy account (web & mobile)

## Setup Instructions

### 1. Get Chrome Extension Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth client ID**
4. Choose **Web application** as the application type
5. Name it: "Study Buddy Chrome Extension"
6. Add to **Authorized JavaScript origins**:
   ```
   chrome-extension://
   ```
7. Copy the **Client ID**

### 2. Configure Extension

1. Open `manifest.json`
2. Replace `YOUR_CHROME_EXTENSION_CLIENT_ID_HERE.apps.googleusercontent.com` with your actual Client ID
3. Save the file

### 3. Update Backend (if needed)

The backend should handle `platform: 'chrome-extension'` in the `/auth/google` endpoint. If it doesn't, you'll need to update it to support Chrome extension authentication using Google access tokens.

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder
5. Copy the Extension ID shown (you'll need it for Google OAuth setup)

### 5. Update Google OAuth Redirect URI

1. Go back to Google Cloud Console → Your Chrome Extension OAuth Client
2. Add to **Authorized redirect URIs**:
   ```
   https://[YOUR-EXTENSION-ID].chromiumapp.org/
   ```
   (Replace `[YOUR-EXTENSION-ID]` with the ID from step 4)

## Usage

1. **Sign In**: Click the extension icon and sign in with Google
2. **Capture Notes**: 
   - Select any text on a webpage
   - The Study Buddy popup will appear
   - Enter a title (optional)
   - Click "Save Note" to save to your account
3. **AI Chat**:
   - Select text
   - Go to "AI Chat" tab in popup
   - Ask questions about the selected text
4. **Video Analysis**:
   - Click extension icon
   - Go to "Video" tab
   - Paste a YouTube URL
   - Click "Analyze Video"
   - Results will appear in your Study Buddy account

## File Structure

```
chrome-extension/
├── manifest.json              # Extension configuration
├── background/
│   └── service-worker.js     # Background script (handles API calls & auth)
├── content/
│   ├── content-script.js     # Injected into web pages
│   └── content-style.css    # Styles for popup UI
├── popup/
│   ├── popup.html           # Extension popup UI
│   ├── popup.js             # Popup logic
│   └── popup.css            # Popup styles
├── src/
│   └── api-client.js        # API client for backend
├── icons/                   # Extension icons (add your icons here)
└── README.md
```

## API Integration

The extension connects to:
- Backend API: `https://rork-study-buddy-production-eeeb.up.railway.app`
- Uses existing endpoints:
  - `POST /auth/google` - Authentication
  - `POST /notes` - Create notes
  - `POST /ai/personalized-chat` - AI chat
  - `POST /video/analyze-url` - Video analysis
  - `POST /ai/generate` - Generate summaries

## Notes

- All notes are saved to the user's Study Buddy account
- Notes sync with the web app and mobile app
- Authentication uses Google OAuth 2.0
- Tokens are stored securely in Chrome storage

## Development

To modify the extension:
1. Make changes to files
2. Go to `chrome://extensions/`
3. Click the reload icon on the extension card
4. Test your changes

## Publishing

When ready to publish:
1. Create icons (16x16, 48x48, 128x128 PNG files)
2. Place them in the `icons/` folder
3. Update `manifest.json` if needed
4. Create a ZIP file of the extension folder
5. Submit to [Chrome Web Store](https://chrome.google.com/webstore/devconsole)


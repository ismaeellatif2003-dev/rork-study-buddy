# 🚨 Common Chrome Extension Errors & Fixes

## Quick Diagnostic:

Share the **exact error message** you see. Common ones:

### Error: "Could not load service worker"
**Location:** `chrome://extensions/` → Errors section
**Fix:** Check `background/service-worker.js` exists and has no syntax errors

### Error: "Could not load icon"
**Fix:** Ensure all icon files exist:
- `icons/icon-16.png`
- `icons/icon-48.png`  
- `icons/icon-128.png`

### Error: "Failed to load extension"
**Fix:** Check manifest.json is valid JSON

### Error: "Uncaught ReferenceError: StudyBuddyAPI is not defined"
**Location:** Service Worker console
**Fix:** Check `importScripts('../src/api-client.js')` path is correct

## How to See Errors:

### Method 1: Extension Errors Page
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Find "Study Buddy"
4. Click **"Errors"** button (if visible)
5. Copy the error message

### Method 2: Service Worker Console
1. Go to `chrome://extensions/`
2. Find "Study Buddy"
3. Click **"Service worker"** link (opens console)
4. Look for red errors
5. Copy error message

### Method 3: Popup Console
1. Right-click extension icon
2. Click "Inspect popup"
3. Go to "Console" tab
4. Look for red errors
5. Copy error message

## Quick Fixes to Try:

1. **Reload Extension:**
   - `chrome://extensions/`
   - Click reload button (🔄) on Study Buddy

2. **Remove & Re-add:**
   - Remove extension completely
   - Load unpacked again

3. **Clear Extension Storage:**
   - `chrome://extensions/`
   - Study Buddy → Details
   - Scroll to "Storage"
   - Click "Clear"

## Share This Info:

When reporting errors, please include:
- ✅ Exact error message (copy/paste)
- ✅ Where you see it (Extensions page? Console?)
- ✅ What you were doing when it happened
- ✅ Any red text or error codes


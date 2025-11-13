# 🔧 Debug Instructions - If You Still Can't See Changes

## ⚠️ IMPORTANT: Complete Reload Required

Chrome caches extensions aggressively. Follow these steps **exactly**:

### Step 1: Remove Old Extension
1. Go to `chrome://extensions/`
2. Find "Study Buddy"
3. Click **"Remove"** (red button)
4. Confirm removal

### Step 2: Load Fresh Extension
1. In `chrome://extensions/`, enable **"Developer mode"** (top right toggle)
2. Click **"Load unpacked"**
3. Navigate to: `/Users/ishy/rork-study-buddy/chrome-extension`
4. Click "Select Folder"

### Step 3: Verify Files Are Updated
Open Chrome DevTools console to check:
1. Right-click extension icon → "Inspect popup"
2. Check Console tab for any errors
3. Look for messages starting with `updateAuthUI`

### Step 4: Test the Popup
1. Click the extension icon
2. You should IMMEDIATELY see:
   - **Yellow warning box**: "⚠️ Sign in Required"
   - **Blue button**: "🔐 Sign in with Google"

### Step 5: If Still Not Working

#### Check Browser Console:
1. Right-click extension icon → "Inspect popup"
2. Go to Console tab
3. Look for red errors
4. Share any errors you see

#### Verify File Content:
Open these files directly and check they exist:
- `/Users/ishy/rork-study-buddy/chrome-extension/popup/popup.html` - Should have auth section
- `/Users/ishy/rork-study-buddy/chrome-extension/popup/popup.js` - Should call `updateAuthUI()`

#### Clear All Extension Data:
1. Go to `chrome://extensions/`
2. Find "Study Buddy"
3. Click "Details"
4. Scroll to "Storage"
5. Click "Clear" under "Storage"
6. Reload extension

#### Hard Refresh:
1. Close ALL Chrome windows completely
2. Reopen Chrome
3. Load extension again

## 🔍 What You Should See:

### Popup (Extension Icon Click):
```
📚 Study Buddy

┌─────────────────────────────┐
│ ⚠️ Sign in Required        │
│ You must sign in with      │
│ Google to use Study Buddy  │
└─────────────────────────────┘

[🔐 Sign in with Google]

📋 Sidebar Panel
...
```

### If Signed In (Free):
```
┌─────────────────────────────┐
│ [Avatar] John Doe • Free   │
│         john@email.com     │
│                            │
│ [⬆️ Upgrade to Pro]       │
│ [Sign Out]                 │
└─────────────────────────────┘
```

### If Signed In (Pro):
```
┌─────────────────────────────┐
│ [Avatar] John Doe • ✓ Pro  │
│         john@email.com     │
│                            │
│ [Sign Out]                 │
└─────────────────────────────┘
```

## 📞 If Nothing Works:

1. Share any console errors
2. Confirm you're loading from: `/Users/ishy/rork-study-buddy/chrome-extension`
3. Confirm Chrome version (should be recent)
4. Try in a different Chrome profile or incognito mode


# 🔄 How to Reload the Extension to See Changes

## Step-by-Step Instructions:

### 1. **Reload the Extension in Chrome**
   - Open Chrome
   - Go to: `chrome://extensions/`
   - Find "Study Buddy" extension
   - Click the **🔄 Reload** button (circular arrow icon) on the extension card
   - OR toggle the extension off and on

### 2. **Reload All Tabs with the Sidebar**
   - After reloading the extension, you need to refresh ALL tabs where you want to see the sidebar
   - Click the refresh button on each tab
   - OR press `Cmd+R` (Mac) / `Ctrl+R` (Windows)

### 3. **Hard Reload (if still not working)**
   - Close Chrome completely
   - Reopen Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder again
   - This forces a complete reload

### 4. **Clear Extension Storage (if UI stuck)**
   - Go to `chrome://extensions/`
   - Find "Study Buddy"
   - Click "Details"
   - Scroll down to "Storage"
   - Click "Clear" next to "Storage"
   - Reload extension again

## ✅ What You Should See After Reloading:

### In the Extension Popup:
1. If NOT signed in:
   - ⚠️ Yellow warning: "Sign in Required"
   - "You must sign in with Google to use Study Buddy"
   - 🔐 "Sign in with Google" button

2. If signed in (Free plan):
   - Your name and email
   - "Free" badge (orange)
   - ⬆️ "Upgrade to Pro" button

3. If signed in (Pro plan):
   - Your name and email
   - "✓ Pro" badge (green)

### In the Sidebar (on web pages):
1. If NOT signed in:
   - 🔐 Yellow banner: "Sign In Required"
   - Message about signing in
   - Buttons disabled (grayed out)

2. If signed in (Free plan):
   - ⬆️ Blue banner: "Upgrade to Pro"
   - "Unlock AI features..."
   - "Upgrade Now" button
   - Save Note button works
   - Generate Summary disabled (Pro feature)

3. If signed in (Pro plan):
   - No banners
   - All buttons enabled
   - Full access

## 🐛 Troubleshooting:

### If sidebar doesn't appear:
1. Check sidebar toggle in popup (should be ON)
2. Reload the webpage
3. Check browser console for errors (`Cmd+Option+J` / `Ctrl+Shift+J`)

### If auth messages don't show:
1. Clear extension storage (step 4 above)
2. Sign out and sign back in
3. Check browser console for errors

### If upgrade prompts don't work:
1. Verify you're on Free plan (check popup badge)
2. Try clicking a Pro feature (Generate Summary)
3. Should see upgrade confirmation dialog

## 📍 Current Extension Location:
`/Users/ishy/rork-study-buddy/chrome-extension/`

Make sure you're loading this folder in Chrome!


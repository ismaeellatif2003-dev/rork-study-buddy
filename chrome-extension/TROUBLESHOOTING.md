# 🔧 Chrome Extension Troubleshooting

## Common Errors & Fixes:

### Error 1: "Failed to load service worker"
**Fix:**
- Check `background/service-worker.js` path is correct in manifest.json
- Ensure no ES6 module syntax (`import/export`)
- Use `importScripts()` for loading other scripts

### Error 2: "Could not load icon"
**Fix:**
- Ensure icons exist: `icons/icon-16.png`, `icons/icon-48.png`, `icons/icon-128.png`
- Icons must be actual PNG files (not placeholders)

### Error 3: "Cannot find module"
**Fix:**
- Service workers can't use ES6 imports
- Use `importScripts('../src/api-client.js')` instead
- Check file paths are relative to service-worker.js location

### Error 4: "Content script failed to inject"
**Fix:**
- Check `content/content-script.js` exists
- Ensure manifest.json has correct `matches` pattern
- Check for JavaScript errors in content script

### Error 5: "OAuth2 client_id not configured"
**Fix:**
- Verify `client_id` in manifest.json matches Google Console
- Ensure redirect URI is added in Google Console

## How to Check Errors:

1. **Go to** `chrome://extensions/`
2. **Enable** "Developer mode"
3. **Click** "Errors" link under your extension
4. **Check Console:**
   - Right-click extension icon → "Inspect popup"
   - Go to Console tab
5. **Check Service Worker:**
   - Go to `chrome://extensions/`
   - Click "Service worker" link under your extension
   - Check console for errors

## Debug Checklist:

- [ ] All icon files exist (16px, 48px, 128px)
- [ ] manifest.json is valid JSON
- [ ] No ES6 imports in service worker (use importScripts)
- [ ] All file paths in manifest are correct
- [ ] No syntax errors in JavaScript files
- [ ] OAuth2 client_id is correct
- [ ] Host permissions match your API URLs


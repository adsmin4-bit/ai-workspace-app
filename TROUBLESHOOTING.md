# 🔧 Troubleshooting Guide

## Localhost Access Issues

If you're having trouble accessing localhost, try these solutions:

### 1. Chrome/Edge HTTPS Redirect Issue

If Chrome automatically redirects `http://localhost:3000` to `https://localhost:3000`:

1. Open Chrome and go to: `chrome://net-internals/#hsts`
2. Scroll down to "Delete domain security policies"
3. Enter "localhost" and click "Delete"
4. Restart Chrome

### 2. Windows Hosts File Issue

If localhost doesn't work at all:

1. Open Notepad as Administrator
2. Open: `C:\Windows\System32\drivers\etc\hosts`
3. Make sure this line is NOT commented out:
   ```
   127.0.0.1 localhost
   ```
4. If you see `#::1 localhost`, comment it out by adding `#` at the beginning

### 3. Port Already in Use

If you get "Port 3000 is in use":

1. Kill all Node.js processes:
   ```bash
   taskkill /f /im node.exe
   ```
2. Or use a different port:
   ```bash
   npm run dev -- -p 3001
   ```

### 4. API Key Issues

If you get "model not found" errors:

1. Make sure your `.env.local` file has the correct API keys
2. Check that your OpenAI API key is valid
3. Ensure you have credits in your OpenAI account

### 5. Browser Console Errors

Ignore these errors - they're from browser extensions:
- `console-listener.js` errors
- `foreground.js` errors
- Chrome extension errors

These don't affect the app functionality.

## Quick Fixes

1. **Clear browser cache** and try again
2. **Use incognito/private mode** to test
3. **Try a different browser** (Firefox, Safari)
4. **Restart the development server**:
   ```bash
   npm run dev
   ```

## Still Having Issues?

1. Check the terminal for error messages
2. Make sure all environment variables are set in `.env.local`
3. Verify your API keys are working
4. Try accessing `http://127.0.0.1:3000` instead of `localhost:3000` 
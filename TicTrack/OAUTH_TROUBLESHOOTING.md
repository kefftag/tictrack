# OAuth White Screen Troubleshooting Guide

## Issue: White Screen After Google Authentication

If you're seeing a white screen after selecting your Google account and granting permissions, this means the OAuth redirect is failing.

## Most Common Cause (95% of cases)

**The redirect URI is not properly configured in Google Cloud Console.**

### ✅ Required Setup

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project

2. **Go to Credentials**
   - APIs & Services → Credentials
   - Find your **Web application** OAuth 2.0 Client ID
   - Click to edit it

3. **Add the Exact Redirect URI**

   Under "Authorized redirect URIs", add EXACTLY:
   ```
   https://auth.expo.io/@keffeine/TicTrack
   ```

   **CRITICAL NOTES:**
   - Must be **EXACT** match (case-sensitive)
   - Must use **@keffeine** (your Expo username)
   - Must use **TicTrack** (your app slug from app.json)
   - Do NOT add trailing slash
   - Do NOT use http:// (must be https://)

4. **Save Changes**
   - Click "Save" at the bottom
   - Wait 1-2 minutes for changes to propagate

5. **Also Add the Anonymous Redirect (Optional but Recommended)**
   ```
   https://auth.expo.io/@anonymous/TicTrack
   ```

   This helps during development if you're not signed into Expo.

## Verification Checklist

After adding the redirect URIs, verify:

- [ ] Used the **Web application** client type (not Android or iOS)
- [ ] Client ID starts with your project number (640350728157-...)
- [ ] Redirect URI is **exactly**: `https://auth.expo.io/@keffeine/TicTrack`
- [ ] No typos in username or slug
- [ ] Clicked "Save" in Google Cloud Console
- [ ] Waited 1-2 minutes for propagation

## Testing After Setup

1. **Clear Expo Cache**
   ```bash
   npx expo start --clear
   ```

2. **Restart Expo Go App**
   - Force quit Expo Go
   - Reopen and reload the app

3. **Try OAuth Again**
   - Go to Settings
   - Tap "Sign in with Google"
   - Watch console logs carefully

## Expected Console Logs

### On Sign In:
```
=== Starting Google Sign In ===
Request ready: true
Redirect URI: https://auth.expo.io/@keffeine/TicTrack
Client ID: 640350728157-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com
===============================
```

### On Success:
```
=== Prompt Result ===
Result type: success
Result authentication: { accessToken: "...", ... }
====================

=== Response Changed ===
Response type: success
=======================

=== Google OAuth Response ===
Response type: success
Authentication: { accessToken: "...", ... }
=============================

✅ OAuth success in promptAsync result!
```

### If Still Getting Error:
```
Result type: error
Result error: redirect_uri_mismatch
```

This means the redirect URI in Google Cloud Console still doesn't match.

## Common Mistakes

### ❌ Wrong Username
```
https://auth.expo.io/@kefftag/TicTrack  ← Wrong!
```
Should be `@keffeine` (check with `npx expo whoami`)

### ❌ Wrong Slug
```
https://auth.expo.io/@keffeine/tictrack  ← Wrong case!
```
Should match slug in app.json exactly: `TicTrack`

### ❌ Wrong Client Type
Using Android or iOS client ID instead of Web client ID

### ❌ Typos
```
https://auth.expo.io/@keffeine/TicTrak   ← Missing 'c'
https://auth.expo.io/@keffeine/TicTrack/ ← Extra slash
```

### ❌ Not Saved
Editing the client but forgetting to click "Save"

## Advanced Debugging

### Check Expo Username
```bash
npx expo whoami
```
Should output: `keffeine`

### Check App Slug
Look in `app.json`:
```json
{
  "expo": {
    "slug": "TicTrack"
  }
}
```

### Verify Client Type
In Google Cloud Console, your OAuth client should say:
- **Type**: Web application
- **NOT**: Android or iOS

### Check Redirect URI in Real-Time
The app logs the redirect URI when you tap sign in. It should show:
```
Redirect URI: https://auth.expo.io/@keffeine/TicTrack
```

If it shows something different (like `exp://192.168...`), the code is wrong.

## If Still Not Working

1. **Try the Anonymous Redirect**

   Add this too:
   ```
   https://auth.expo.io/@anonymous/TicTrack
   ```

2. **Create New OAuth Client**

   Sometimes Google caches old settings. Create a fresh Web client ID.

3. **Check Google OAuth Scopes**

   Make sure your OAuth consent screen is configured and published.

4. **Enable APIs**

   Ensure these are enabled:
   - Google People API
   - Google+ API (legacy but sometimes needed)

5. **Check Expo Account**

   Make sure you're signed into the correct Expo account:
   ```bash
   npx expo logout
   npx expo login
   ```

## Expected Behavior

✅ **Correct Flow:**
1. Tap "Sign in with Google"
2. Browser/WebView opens to Google
3. Select account
4. Grant permissions
5. **Browser redirects to https://auth.expo.io/...**
6. **Expo auth proxy processes the code**
7. **App resumes with success response**
8. "Signed in as [email]" alert

❌ **White Screen Problem:**
1. Tap "Sign in with Google"
2. Browser/WebView opens to Google
3. Select account
4. Grant permissions
5. **White screen appears**
6. **Nothing happens**
7. **No response in app**

The white screen is the Expo auth proxy waiting for the redirect URI to be authorized by Google.

## Need More Help?

Share these logs:
1. Console output from "Starting Google Sign In" to "Prompt Result"
2. Screenshot of your Google Cloud Console Credentials page (OAuth client)
3. Output of `npx expo whoami`
4. Contents of `expo.slug` from app.json

## Quick Fix Checklist

- [ ] Sign into Google Cloud Console
- [ ] Go to: APIs & Services → Credentials
- [ ] Edit your **Web** OAuth client
- [ ] Add: `https://auth.expo.io/@keffeine/TicTrack`
- [ ] Click Save
- [ ] Wait 2 minutes
- [ ] Run: `npx expo start --clear`
- [ ] Force quit Expo Go
- [ ] Reload and test

If you've done all of this and it still doesn't work, the issue is likely with Google's OAuth consent screen or API enablement.

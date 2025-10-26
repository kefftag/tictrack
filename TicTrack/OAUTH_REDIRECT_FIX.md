# OAuth Redirect Fix - Required Steps

## ✅ Code Changes (Already Done)

The code has been updated to use the **Web Client ID** for OAuth authentication. This fixes the redirect issue where you were being sent to google.com instead of back to the app.

**Changes made:**
- Updated `SettingsScreen.tsx` to use web client ID as primary
- Updated `googleAuthService.ts` with web client ID
- Kept Android client ID for native features

---

## 🔧 What You Need to Do Now

### Step 1: Add Redirect URIs to Google Cloud Console

1. **Go to Google Cloud Console:**
   - Navigate to: https://console.cloud.google.com/
   - Select your project
   - Go to **APIs & Services** → **Credentials**

2. **Find your Web Client:**
   - Look for the OAuth 2.0 Client ID with:
   - **Client ID**: `640350728157-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com`
   - **Type**: Web application

3. **Click on the Web Client to edit it**

4. **Add Authorized Redirect URIs:**

   Click **+ ADD URI** and add BOTH of these URIs:

   ```
   https://auth.expo.io/@anonymous/TicTrack
   ```

   ```
   https://auth.expo.io/@keffeine/TicTrack
   ```

   **Note:**
   - The first one (`@anonymous`) is for Expo Go testing
   - The second one (`@keffeine`) is for your Expo account
   - Both URIs are needed for different testing scenarios

5. **Click SAVE**

---

## Step 2: Verify Your Configuration

After adding the redirect URIs, verify your setup:

### Web OAuth Client Should Have:
- **Client ID**: `640350728157-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com`
- **Authorized redirect URIs**:
  - `https://auth.expo.io/@anonymous/TicTrack`
  - `https://auth.expo.io/@keffeine/TicTrack`

### Android OAuth Client (for native features):
- **Client ID**: `640350728157-aquqtlpar5rj7ndpiuhae6hibivg4q9u.apps.googleusercontent.com`
- **Package name**: `com.tictrack.app`
- **SHA-1 certificate fingerprint**: See below for how to get this

---

## Step 2.5: Get Your SHA-1 Certificate Fingerprint (for Android OAuth Client)

The Android OAuth client needs your SHA-1 certificate fingerprint. Here's how to get it:

### For Windows:

**Debug Keystore (for development):**
```cmd
cd %USERPROFILE%\.android
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Look for this line in the output:**
```
SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

Copy that SHA-1 value and add it to your Android OAuth client in Google Cloud Console.

### For macOS/Linux:

**Debug Keystore (for development):**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Look for this line in the output:**
```
SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

### For Release Build:

If you're building for production, you'll need the SHA-1 from your **release keystore**:

```bash
keytool -list -v -keystore /path/to/your-release-key.keystore -alias your-key-alias
```

You'll be prompted for the keystore password.

### Adding SHA-1 to Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Click on your **Android OAuth client** (`640350728157-aquqtlpar5rj7ndpiuhae6hibivg4q9u`)
3. You should see:
   - **Package name**: `com.tictrack.app`
   - **SHA-1 certificate fingerprint**: (add your SHA-1 here)
4. If the SHA-1 field is empty or you need to add another one (debug + release):
   - You may need to edit or recreate the Android OAuth client
   - Some configurations allow multiple SHA-1 fingerprints (one for debug, one for release)

### Troubleshooting:

**If `keytool` command not found:**
- Make sure Java JDK is installed
- Add Java bin directory to your PATH
- Try using the full path: `C:\Program Files\Java\jdk-XX\bin\keytool.exe`

**If debug.keystore doesn't exist:**
- It's created automatically when you build an Android app
- Run `npx expo run:android` once to generate it
- Or run any Android build command

**If you get an error about the keystore:**
- Make sure you're using the correct password (`android` for debug keystore)
- The alias should be `androiddebugkey` for debug builds

---

## Step 3: Test the OAuth Flow

### A. Clear Cache and Rebuild
```bash
# Clear everything
npx expo start --clear

# Or if using npm
npm start -- --clear
```

### B. Run on Android Device
```bash
npx expo run:android
```

### C. Test Sign-In
1. Open TicTrack app
2. Go to **Settings** tab
3. Scroll to **Google Contacts Integration**
4. Tap **Sign in with Google**
5. You should see Google sign-in page
6. Grant permissions
7. **You should be redirected back to TicTrack** ✅
8. You should see your Google account info in Settings

---

## 🎯 Expected Behavior After Fix

### ✅ What Should Happen:
1. Tap "Sign in with Google" → Opens Google OAuth page
2. Select your Google account → Asks for permissions
3. Grant permissions → **Redirects back to TicTrack app**
4. Your profile appears in Settings (name, email, avatar)
5. Status shows "Connected"
6. Contacts will now save to Google Contacts

### ❌ What Should NOT Happen:
- ~~Redirect to google.com~~ (This was the bug, now fixed)
- ~~Browser stays open after auth~~
- ~~No profile information shown~~

---

## 🐛 Troubleshooting

### Issue: Still redirecting to google.com

**Cause**: Redirect URIs not added correctly to Google Cloud Console

**Fix**:
1. Double-check the redirect URIs are EXACTLY:
   - `https://auth.expo.io/@anonymous/TicTrack`
   - `https://auth.expo.io/@keffeine/TicTrack`
2. Make sure they're added to the **WEB client**, not Android client
3. Click SAVE in Google Cloud Console
4. Wait 5 minutes for changes to propagate
5. Try again

### Issue: "Error 400: redirect_uri_mismatch"

**Cause**: The redirect URI in the request doesn't match what's in Google Cloud Console

**Fix**:
1. Look at the error URL, it will show you the redirect URI being used
2. Add that exact URI to your Google Cloud Console Web client
3. Save and try again

### Issue: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not configured properly

**Fix**:
1. Go to **OAuth consent screen** in Google Cloud Console
2. Make sure your Google account is added as a test user
3. Verify all scopes are added:
   - `https://www.googleapis.com/auth/contacts`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### Issue: Can't find Expo username

**Solution**: Check your Expo account
```bash
# Check if logged into Expo
npx expo whoami

# If not logged in, login
npx expo login

# Or just use @anonymous for testing
```

---

## 📋 Quick Checklist

Before testing, verify:
- [ ] Web client ID is `640350728157-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com`
- [ ] Redirect URI `https://auth.expo.io/@anonymous/TicTrack` is added
- [ ] Redirect URI `https://auth.expo.io/@keffeine/TicTrack` is added
- [ ] Both URIs are in the **WEB client**, not Android client
- [ ] Changes are SAVED in Google Cloud Console
- [ ] App has been rebuilt with `npx expo start --clear`
- [ ] Testing on physical device or emulator

---

## 📸 Visual Guide

### Google Cloud Console - Where to Add URIs:

1. **APIs & Services** → **Credentials**
2. Click on your **Web client ID** (ends in `-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com`)
3. Scroll to **Authorized redirect URIs**
4. Click **+ ADD URI**
5. Paste: `https://auth.expo.io/@anonymous/TicTrack`
6. Click **+ ADD URI** again
7. Paste: `https://auth.expo.io/@keffeine/TicTrack`
8. Click **SAVE** at the bottom

---

## ✅ After Successful Sign-In

Once signed in, you'll see in Settings:
- ✓ Your Google profile picture
- ✓ Your name
- ✓ Your email address
- ✓ "Connected" status
- ✓ "Contacts will be saved to Google Contacts" message

Try saving a contact - it should now go directly to Google Contacts!

---

## 🆘 Still Having Issues?

If you're still stuck after following all steps:

1. **Check the console logs:**
   ```bash
   npx expo start --clear
   ```
   Look for any error messages about redirect URIs

2. **Verify the redirect URI being used:**
   Add this to your code temporarily to see what URI is being generated:
   ```typescript
   import * as AuthSession from 'expo-auth-session';
   const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
   console.log('Redirect URI:', redirectUri);
   ```

3. **Share the error:**
   If you get an error, copy the full error message or URL and check what redirect URI it's trying to use.

---

## Summary

**What was changed in code:**
- ✅ Using web client ID instead of Android client ID for OAuth
- ✅ Proper Expo redirect URI handling

**What you need to do:**
1. ✅ Add redirect URIs to Google Cloud Console Web client
2. ✅ Rebuild and test the app

That's it! The OAuth redirect issue should now be fixed. 🎉

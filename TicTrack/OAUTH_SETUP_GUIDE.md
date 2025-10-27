# Google OAuth Setup Guide for TicTrack

This guide explains how to set up Google OAuth for TicTrack in both **Expo Go** and **dev build/production** environments.

---

## 🔍 Understanding the Error: "Authorization Error 400: invalid_request"

**Why this happens:**
- You're running a **dev build** (not Expo Go)
- In dev builds, `makeRedirectUri({ useProxy: true })` generates a local URI like `exp://192.168.0.218:8081`
- Google OAuth **rejects any redirect URI** not explicitly whitelisted in Google Cloud Console
- This causes the "Access blocked: Authorization Error 400" screen

**The fix:** Match your runtime environment (Expo Go vs dev build) with the correct OAuth client type and redirect URI.

---

## 📊 Quick Reference Table

| Runtime             | Redirect URI Generated              | OAuth Client Type | What to Whitelist in Google Cloud                        |
|---------------------|-------------------------------------|-------------------|----------------------------------------------------------|
| **Expo Go**         | `https://auth.expo.io/@keffeine/TicTrack` | Web Application   | `https://auth.expo.io/@keffeine/TicTrack`                |
| **Dev Build / APK** | `tictrack://`                       | Android / iOS     | No redirect URI needed (automatic with package/bundle)   |

---

## ✅ Option 1: Use Expo Go (Proxy Flow) - Quick Development

### When to use this:
- Quick testing and development
- No need to rebuild the app
- Works with Web OAuth client

### Steps:

#### 1. Run in Expo Go
Make sure you're running the app **inside the Expo Go app**, not a dev build:
```bash
npx expo start
# Scan the QR code with Expo Go app
```

#### 2. Verify Runtime Detection
Open the app and go to Settings. Check the console logs:
```
=== OAuth Configuration ===
Runtime Environment: Expo Go (proxy flow)
Execution Environment: storeClient
Generated Redirect URI: https://auth.expo.io/@keffeine/TicTrack
Using Proxy: true
```

If you see "Dev Build (native flow)", you're not in Expo Go.

#### 3. Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services > Credentials**
4. Edit your **Web application** OAuth 2.0 client
5. Under **Authorized redirect URIs**, add:
   ```
   https://auth.expo.io/@keffeine/TicTrack
   ```
6. Also add (for fallback):
   ```
   https://auth.expo.io/@anonymous/TicTrack
   ```
7. Save

#### 4. The code is already set up:
```typescript
// App automatically detects Expo Go and uses:
const redirectUri = makeRedirectUri({ useProxy: true });
const result = await promptAsync({ useProxy: true });
```

#### 5. Test
- Open Settings tab
- Tap "Sign in with Google"
- Should open Google consent screen without errors

---

## ✅ Option 2: Use Dev Build (Native Flow) - Recommended for Production

### When to use this:
- Real device testing
- Production builds
- Custom native modules
- Testing actual app behavior

### Steps:

#### 1. Get Your Debug Keystore SHA-1 (Android)
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA-1** fingerprint (looks like: `A1:B2:C3:...`)

For **release builds**, you'll also need the release keystore SHA-1:
```bash
keytool -list -v -keystore /path/to/release.keystore -alias your-alias
```

#### 2. Create Android OAuth Client in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Android**
6. Fill in:
   - **Name**: TicTrack Android (Debug) or TicTrack Android (Release)
   - **Package name**: `com.tictag.tictrack`
   - **SHA-1 certificate fingerprint**: Paste your debug (or release) SHA-1
7. Click **Create**
8. **Copy the Client ID** (format: `123456789-abc.apps.googleusercontent.com`)

**Important:** You do **NOT** need to add redirect URIs for Android/iOS clients. Google handles this automatically using the package name and SHA-1.

#### 3. Create iOS OAuth Client (if testing on iOS)

1. In Google Cloud Console, click **Create Credentials > OAuth client ID**
2. Select **iOS**
3. Fill in:
   - **Name**: TicTrack iOS
   - **Bundle ID**: `com.tictag.tictrack`
4. Click **Create**
5. **Copy the Client ID**

#### 4. Update SettingsScreen.tsx

Open `/TicTrack/src/screens/SettingsScreen.tsx` and replace the placeholder client IDs (lines 80-81):

```typescript
androidClientId: '123456789-abc.apps.googleusercontent.com',  // Your Android client ID
iosClientId: '987654321-xyz.apps.googleusercontent.com',      // Your iOS client ID
```

Example:
```typescript
const oauthConfig = inExpoGo
  ? {
      clientId: '640350728157-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com',
      redirectUri,
    }
  : {
      androidClientId: '640350728157-abc123def456.apps.googleusercontent.com',  // ← Replace this
      iosClientId: '640350728157-xyz789uvw456.apps.googleusercontent.com',      // ← Replace this
      redirectUri,
    };
```

#### 5. Rebuild Your Dev Build

After updating the client IDs, rebuild:

**Local dev build:**
```bash
npx expo run:android
# or
npx expo run:ios
```

**EAS dev build:**
```bash
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

#### 6. Verify Runtime Detection

Open the app and check the console:
```
=== OAuth Configuration ===
Runtime Environment: Dev Build (native flow)
Execution Environment: standalone
Generated Redirect URI: tictrack://
Using native scheme (no proxy)
```

#### 7. Test

- Open Settings tab
- Tap "Sign in with Google"
- Should open Google consent screen without errors
- After accepting, should return to the app and show "Signed in as [email]"

---

## 🔄 Switching Between Environments

The app **automatically detects** which runtime it's in:

```typescript
const inExpoGo = Constants.executionEnvironment === 'storeClient';
```

- **Expo Go** (`storeClient`): Uses Web client + proxy
- **Dev Build** (`standalone`): Uses Android/iOS clients + native scheme

**No code changes needed** when switching between Expo Go and dev builds!

---

## 🚨 Common Issues

### Issue: Still seeing "Authorization Error 400"

**Check these:**
1. **Are you in the right runtime?**
   - Check console logs: "Runtime Environment: Expo Go" vs "Dev Build"
   - If you want Expo Go, make sure you're using the Expo Go app
   - If you want dev build, make sure you've run `npx expo run:android`

2. **Is the redirect URI whitelisted?**
   - **Expo Go**: Web client must have `https://auth.expo.io/@keffeine/TicTrack`
   - **Dev Build**: Android/iOS clients don't need redirect URIs (handled by package name + SHA-1)

3. **Did you use the correct client type?**
   - **Expo Go**: Web application OAuth client
   - **Android dev build**: Android OAuth client (not Web!)
   - **iOS dev build**: iOS OAuth client (not Web!)

4. **Did you update the client IDs in the code?**
   - Check `SettingsScreen.tsx` lines 80-81
   - Replace `YOUR_ANDROID_CLIENT_ID` with actual client ID

5. **Did you rebuild after changes?**
   - After updating `app.json` or client IDs, you **must rebuild**:
     ```bash
     npx expo run:android
     ```

### Issue: White screen after Google sign-in

**This was the original issue.** If you still see this:
1. Check that `WebBrowser.maybeCompleteAuthSession()` is called at module level
2. Verify the redirect URI matches what Google expects
3. Check console logs for error messages

### Issue: "redirect_uri_mismatch"

**Cause:** The redirect URI in your request doesn't match what's in Google Cloud Console.

**Fix:**
- **Expo Go**: Add `https://auth.expo.io/@keffeine/TicTrack` to Web client
- **Dev Build**: Make sure you're using Android/iOS OAuth clients (not Web client)

---

## 📝 Summary Checklist

### For Expo Go (Quick Development):
- [ ] Running app in Expo Go app (not dev build)
- [ ] Console shows "Expo Go (proxy flow)"
- [ ] Using Web OAuth client in Google Cloud
- [ ] Redirect URI `https://auth.expo.io/@keffeine/TicTrack` added to Web client
- [ ] No code changes needed

### For Dev Build (Production):
- [ ] Created Android OAuth client with package `com.tictag.tictrack` + SHA-1
- [ ] Created iOS OAuth client with bundle ID `com.tictag.tictrack` (if testing iOS)
- [ ] Updated `androidClientId` and `iosClientId` in `SettingsScreen.tsx`
- [ ] Rebuilt app: `npx expo run:android` or `eas build`
- [ ] Console shows "Dev Build (native flow)"
- [ ] Redirect URI shows `tictrack://`

---

## 🎯 What You Should See When Working

### Expo Go (Successful):
```
=== OAuth Configuration ===
Runtime Environment: Expo Go (proxy flow)
Generated Redirect URI: https://auth.expo.io/@keffeine/TicTrack
===========================

=== Starting Google Sign In ===
Runtime: Expo Go
Redirect URI: https://auth.expo.io/@keffeine/TicTrack
===============================

=== Prompt Result ===
Result type: success
====================

✅ OAuth success!
```

### Dev Build (Successful):
```
=== OAuth Configuration ===
Runtime Environment: Dev Build (native flow)
Generated Redirect URI: tictrack://
===========================

=== Starting Google Sign In ===
Runtime: Dev Build
Redirect URI: tictrack://
===============================

=== Prompt Result ===
Result type: success
====================

✅ OAuth success!
```

---

## 📚 Additional Resources

- [Expo Auth Session Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Expo Go vs Development Builds](https://docs.expo.dev/workflow/expo-go-vs-development-builds/)

---

## 💡 Pro Tip

For the **smoothest development experience**, use this workflow:
1. **Initial development**: Use Expo Go for quick iterations
2. **Real testing**: Switch to dev build when you need to test actual device behavior
3. **Production**: Use EAS Build with release credentials

The app automatically handles the OAuth configuration for each environment!

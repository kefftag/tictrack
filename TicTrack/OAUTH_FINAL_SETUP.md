# TicTrack OAuth Setup - Final Configuration

## ✅ Your SHA-1 Certificate Fingerprint

```
A2:52:C3:0E:3E:71:BE:85:FD:C6:E6:55:E7:6D:8F:8C:D7:DD:45:EA
```

This is your **debug keystore SHA-1** for development builds.

---

## 🎯 Complete Setup Instructions

Follow these steps in order:

### Step 1: Configure Web OAuth Client (for OAuth redirect)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Find and click on your **Web application** OAuth client:
   - Client ID: `640350728157-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com`

5. Scroll to **Authorized redirect URIs**
6. Click **+ ADD URI** and add:
   ```
   https://auth.expo.io/@anonymous/TicTrack
   ```

7. Click **+ ADD URI** again and add:
   ```
   https://auth.expo.io/@keffeine/TicTrack
   ```

8. Click **SAVE** at the bottom

---

### Step 2: Configure Android OAuth Client (for native features)

1. Still in **APIs & Services** → **Credentials**
2. Find and click on your **Android** OAuth client:
   - Client ID: `640350728157-aquqtlpar5rj7ndpiuhae6hibivg4q9u.apps.googleusercontent.com`

3. Verify or update these fields:
   - **Application type**: Android
   - **Package name**: `com.tictrack.app`
   - **SHA-1 certificate fingerprint**: `A2:52:C3:0E:3E:71:BE:85:FD:C6:E6:55:E7:6D:8F:8C:D7:DD:45:EA`

4. Click **SAVE**

---

### Step 3: Verify OAuth Consent Screen

1. Go to **OAuth consent screen** (in the left menu)
2. Verify your app is configured:
   - **App name**: TicTrack (or your preferred name)
   - **User support email**: Your email
   - **Developer contact email**: Your email
3. Under **Scopes**, verify these are added:
   - `https://www.googleapis.com/auth/contacts`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
4. Under **Test users**, verify your Google account is added
5. **Publishing status** should be "Testing" for now

---

### Step 4: Rebuild and Test

1. **Clear cache and rebuild:**
   ```bash
   npx expo start --clear
   ```

2. **Run on Android device/emulator:**
   ```bash
   npx expo run:android
   ```

3. **Test the OAuth flow:**
   - Open TicTrack
   - Go to **Settings** tab
   - Scroll to **Google Contacts Integration**
   - Tap **Sign in with Google**
   - Select your Google account
   - Grant permissions
   - **You should be redirected back to TicTrack** ✅
   - Your profile (name, email, avatar) should appear in Settings

---

## 📋 Final Checklist

Before testing, verify all of these:

### Web OAuth Client:
- ✅ Client ID: `640350728157-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com`
- ✅ Redirect URI 1: `https://auth.expo.io/@anonymous/TicTrack`
- ✅ Redirect URI 2: `https://auth.expo.io/@keffeine/TicTrack`
- ✅ Saved

### Android OAuth Client:
- ✅ Client ID: `640350728157-aquqtlpar5rj7ndpiuhae6hibivg4q9u.apps.googleusercontent.com`
- ✅ Package name: `com.tictrack.app`
- ✅ SHA-1: `A2:52:C3:0E:3E:71:BE:85:FD:C6:E6:55:E7:6D:8F:8C:D7:DD:45:EA`
- ✅ Saved

### OAuth Consent Screen:
- ✅ All 3 scopes added (contacts, email, profile)
- ✅ Your Google account added as test user
- ✅ Status is "Testing"

### App:
- ✅ Code uses web client ID (already done)
- ✅ App rebuilt with `--clear` flag
- ✅ Running on Android device/emulator

---

## 🎉 Expected Result

After successful sign-in, you should see in **Settings** → **Google Contacts Integration**:

```
✓ Connected

[Your Profile Picture]
Your Name
your.email@gmail.com

Contacts will be saved to Google Contacts

[Sign Out button]
```

**Then when you save a contact:**
- It will save directly to Google Contacts! ✅
- Will sync across all your devices ✅
- Accessible from contacts.google.com ✅

---

## 🐛 Common Issues & Solutions

### Issue: "redirect_uri_mismatch" error

**Solution:**
- The error message will show which redirect URI it's trying to use
- Make sure that EXACT URI is added to your Web OAuth client
- Common mismatch: Check if it's using `@anonymous` or `@keffeine`
- Add both URIs to be safe

### Issue: "Access blocked" error

**Solution:**
- Make sure your Google account is added as a **test user**
- Go to OAuth consent screen → Test users → Add your email
- Wait a few minutes and try again

### Issue: Still redirecting to google.com

**Solution:**
- Verify redirect URIs are added to the **WEB client**, NOT Android client
- Make sure you clicked SAVE in Google Cloud Console
- Wait 5 minutes for changes to propagate
- Clear app cache and rebuild: `npx expo start --clear`

### Issue: OAuth login works but contacts don't save to Google

**Solution:**
- Check that Google People API is **enabled**
- Go to: APIs & Services → Library → Search "Google People API" → Enable
- Verify the `contacts` scope is in your OAuth consent screen

---

## 📱 For Production Builds

When you're ready to release the app:

1. **Get your release keystore SHA-1:**
   ```bash
   keytool -list -v -keystore /path/to/release.keystore -alias your-alias
   ```

2. **Add the release SHA-1** to your Android OAuth client:
   - You can have multiple SHA-1 fingerprints (debug + release)
   - Add the release SHA-1 as a second fingerprint

3. **Publish OAuth consent screen:**
   - Go to OAuth consent screen
   - Click "Publish App"
   - Submit for verification (required for production)

4. **Update build credentials:**
   - Make sure your release keystore is properly configured in Expo/EAS
   - Verify the package name matches: `com.tictrack.app`

---

## ✅ Quick Summary

**What you need to do RIGHT NOW:**

1. **Web Client** → Add 2 redirect URIs → Save
2. **Android Client** → Add SHA-1 fingerprint → Save
3. **OAuth Consent** → Add test user (your email) → Save
4. **Rebuild app** → `npx expo start --clear` → Test

**That's it!** The OAuth should work after these steps.

---

## 🆘 Need Help?

If you run into any issues:
1. Check the error message carefully
2. Look in the console logs for details
3. Verify all settings match this document exactly
4. Wait 5-10 minutes after saving changes (Google takes time to propagate)

The most common issue is simply forgetting to click SAVE in Google Cloud Console! 😅

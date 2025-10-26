# Google Contacts Integration Setup Guide

This guide explains how to set up Google OAuth authentication for TicTrack to enable direct saving to Google Contacts via the People API.

## Overview

TicTrack can save contacts in two ways:
1. **Google Contacts** (via People API) - Syncs across all devices
2. **Local Phone Contacts** (fallback) - Saves to device only

When a user signs in with Google, contacts are automatically saved to Google Contacts. If not signed in, contacts are saved locally to the phone.

## Prerequisites

- Google Cloud Console account
- Android/iOS development environment set up for Expo

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it "TicTrack" (or your preferred name)

## Step 2: Enable Google People API

1. In your Google Cloud project, go to **APIs & Services** > **Library**
2. Search for "**Google People API**"
3. Click on it and press **Enable**

## Step 3: Create OAuth 2.0 Credentials

### For Android

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Android** as application type
4. For **Package name**, enter: `com.tictrack.app`
5. For **SHA-1 certificate fingerprint**:

   **For Development (Debug):**
   ```bash
   # Get your debug keystore SHA-1
   cd ~/.android
   keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   **For Production (Release):**
   ```bash
   # Get your release keystore SHA-1
   keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
   ```

6. Copy the **Client ID** that's generated (format: `XXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com`)

### For iOS (Optional)

1. Create another OAuth client ID
2. Select **iOS** as application type
3. For **Bundle ID**, enter: `com.tictrack.app`
4. Copy the **Client ID**

### For Web (Optional - for Expo Go testing)

1. Create another OAuth client ID
2. Select **Web application** as application type
3. Add authorized redirect URIs:
   - `https://auth.expo.io/@YOUR_EXPO_USERNAME/TicTrack`
4. Copy the **Client ID**

## Step 4: Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Choose **External** user type (unless you have Google Workspace)
3. Fill in required fields:
   - App name: **TicTrack**
   - User support email: Your email
   - Developer contact email: Your email
4. Click **Save and Continue**

5. Add scopes:
   - Click **Add or Remove Scopes**
   - Add these scopes:
     - `https://www.googleapis.com/auth/contacts` (Create, read, update, and delete contacts)
     - `https://www.googleapis.com/auth/userinfo.email` (See your primary Google Account email address)
     - `https://www.googleapis.com/auth/userinfo.profile` (See your personal info)
   - Click **Update** and **Save and Continue**

6. Add test users (required during testing phase):
   - Click **Add Users**
   - Add your Google account email
   - Click **Save and Continue**

## Step 5: Update TicTrack Code

Update the OAuth client IDs in your code:

### Method 1: Update SettingsScreen.tsx directly

Open `src/screens/SettingsScreen.tsx` and update the `useAuthRequest` configuration (around line 40):

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // Optional
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Optional
  scopes: [
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
});
```

### Method 2: Use environment variables (recommended for production)

Create a `.env` file:

```env
GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Install `react-native-dotenv`:
```bash
npm install react-native-dotenv
```

Then use in your code:
```typescript
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@env';
```

## Step 6: Build and Test

### For Development

1. Start the development server:
   ```bash
   npm start
   ```

2. Run on Android:
   ```bash
   npm run android
   ```

3. In the app:
   - Go to **Settings** tab
   - Scroll to **Google Contacts Integration**
   - Tap **Sign in with Google**
   - Authorize the app

### For Production

1. Build the app:
   ```bash
   eas build --platform android
   ```

2. Publish to Google Play Console (for OAuth verification)

3. Submit app for OAuth verification:
   - Go to Google Cloud Console > OAuth consent screen
   - Click **Publish App**
   - Follow the verification process

## Troubleshooting

### "Sign in with Google" button not working

- Check that client IDs are correctly configured
- Verify SHA-1 fingerprint matches your keystore
- Check that redirect URI scheme matches (`tictrack://redirect`)

### "Access blocked" error

- Make sure your Google account is added as a test user
- Check that all required scopes are added in OAuth consent screen
- Verify the app is in "Testing" mode in OAuth consent screen

### Contacts not saving to Google

- Check that Google People API is enabled
- Verify user has granted contacts permission
- Check console logs for API errors
- Ensure access token is valid (check token expiration)

### Token expired issues

- Tokens are automatically refreshed
- If refresh fails, user will need to sign in again
- Check that refresh token is being stored properly

## OAuth Redirect URI

The app uses this redirect URI format:
```
tictrack://redirect
```

This is configured in `app.json`:
```json
{
  "expo": {
    "scheme": "tictrack"
  }
}
```

## Testing Checklist

- [ ] Android OAuth client ID configured
- [ ] iOS OAuth client ID configured (if building for iOS)
- [ ] Google People API enabled
- [ ] OAuth consent screen configured
- [ ] Test user added to OAuth consent screen
- [ ] Scopes added (contacts, email, profile)
- [ ] App can sign in with Google
- [ ] Contacts save to Google Contacts successfully
- [ ] User info displayed in Settings
- [ ] Sign out works correctly
- [ ] Token refresh works
- [ ] Fallback to local contacts works when signed out

## Security Best Practices

1. **Never commit client secrets** - Keep them in environment variables
2. **Use HTTPS** - All API calls use HTTPS
3. **Validate tokens** - Always verify token expiration
4. **Minimal scopes** - Only request necessary permissions
5. **Secure storage** - Tokens are stored in AsyncStorage (encrypted on device)

## Support

For issues or questions:
- Check [Google People API documentation](https://developers.google.com/people)
- Review [Expo Auth Session docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- Check application logs in development mode

## Additional Resources

- [Google People API Reference](https://developers.google.com/people/api/rest)
- [OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Expo Auth Session Guide](https://docs.expo.dev/guides/authentication/)

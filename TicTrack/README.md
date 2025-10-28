# TicTrack - Business Card Scanner

TicTrack is a cross-platform mobile app (iOS & Android) that uses Claude AI to scan business cards, extract contact information, and generate personalized follow-up messages.

## Features

- **Camera Integration**: Take pictures of business cards using your phone's camera
- **OCR with Claude AI**: Automatically extract contact information using Claude's vision capabilities
- **Contact Management**: Save extracted contacts directly to your phone
- **WhatsApp Integration**: Generate AI-powered follow-up messages and send them via WhatsApp
- **Edit & Review**: Review and edit extracted information before saving

## Prerequisites

- A Claude API key from [console.anthropic.com](https://console.anthropic.com)
- WhatsApp installed on your device (for message sending feature)

## Platform Support

- **iOS**: iPhone and iPad running iOS 13.0 or later
- **Android**: Android 7.0 (API 24) or later

## Installation

### iOS
1. Install via TestFlight (recommended for beta testing)
2. Or download from the App Store (when available)
3. Grant necessary permissions when prompted:
   - Camera access
   - Contacts access
   - Photo Library access

### Android
1. Download the APK file from the releases
2. Enable "Install from unknown sources" in your Android settings
3. Install the APK on your device
4. Grant necessary permissions when prompted:
   - Camera access
   - Contacts access
   - Storage access

## Usage

1. **Launch the app** and enter your Claude API key
2. **Scan a business card** using the camera or select from gallery
3. **Review extracted information** and make any necessary edits
4. **Save to contacts** - the contact is added to your phone
5. **Generate WhatsApp message** (optional):
   - Provide context about your meeting
   - Claude will generate a personalized message
   - Send directly via WhatsApp

## Privacy & Security

- Your API key is stored only in memory during the app session
- Images are processed locally and sent only to Claude API
- No data is stored on external servers beyond Claude API processing

## Permissions Required

- **Camera**: To capture business card photos
- **Contacts**: To save extracted contact information
- **Storage**: To access photos from gallery
- **Internet**: To communicate with Claude API

## Building from Source

### iOS Build

For detailed iOS build instructions, see [IOS_BUILD_GUIDE.md](IOS_BUILD_GUIDE.md).

**Quick Start (iOS):**

```bash
cd TicTrack
npm install

# For simulator
npx expo run:ios

# For production build via EAS
npx eas build --platform ios --profile production
```

**Requirements:**
- macOS with Xcode 14 or later
- Apple Developer Account (free for testing, $99/year for distribution)

### Android Build

#### Option 1: EAS Build (Cloud Build - Recommended)

This is the easiest method and doesn't require Android SDK setup:

```bash
# Navigate to project directory
cd TicTrack

# Install dependencies
npm install

# Login to Expo account (create one at expo.dev if needed)
npx eas login

# Configure EAS (if first time)
npx eas build:configure

# Build the APK
npx eas build --platform android --profile production

# The APK will be uploaded to Expo servers and you'll get a download link
```

#### Option 2: Local Build

Requirements:
- Android Studio with Android SDK installed
- Java JDK 17 or higher
- Node.js 18 or higher

```bash
# Navigate to project directory
cd TicTrack

# Install dependencies
npm install

# Set up environment variables (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Generate native Android project (already done if android/ folder exists)
npx expo prebuild --platform android

# Build the release APK
cd android
./gradlew assembleRelease

# The APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

#### Option 3: Development Build

For testing without creating a release build:

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Press 'a' for Android emulator or 'i' for iOS simulator
# Or scan QR code with Expo Go app
```

## Signing the APK (For Production)

To install the APK on your device without warnings, you should sign it:

```bash
# Generate a signing key
keytool -genkeypair -v -storetype PKCS12 -keystore tictrack-release-key.keystore -alias tictrack-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Add to android/gradle.properties:
MYAPP_RELEASE_STORE_FILE=tictrack-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=tictrack-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_password
MYAPP_RELEASE_KEY_PASSWORD=your_password

# Update android/app/build.gradle signingConfigs
# Then rebuild with: ./gradlew assembleRelease
```

## Technologies Used

- React Native with Expo
- TypeScript
- Claude 3.5 Sonnet API for OCR and message generation
- expo-camera for camera functionality
- expo-contacts for contact management
- expo-linking for WhatsApp integration

## Support

For issues or questions, please open an issue on the GitHub repository.

## License

MIT License

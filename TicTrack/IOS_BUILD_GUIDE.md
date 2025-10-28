# TicTrack - iOS Build Guide

This guide will help you build and deploy the TicTrack app for iOS devices (iPhone and iPad).

## Prerequisites

### Required for All Build Methods
- A Mac computer running macOS 11 or later
- Node.js 18 or higher installed
- An Apple ID (free or paid Apple Developer Account)
- Xcode 14 or later installed from the Mac App Store

### For Distribution (TestFlight/App Store)
- Paid Apple Developer Program membership ($99/year)
- Access to App Store Connect

## Build Methods

### Method 1: EAS Build (Recommended - Cloud Build)

This is the easiest method and handles all the complexity of iOS builds in the cloud.

#### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo
```bash
# Create a free account at expo.dev if you don't have one
eas login
```

#### Step 3: Configure Your Apple Developer Account
```bash
# This will guide you through connecting your Apple ID
eas device:create
```

#### Step 4: Build for iOS

**For Simulator (Testing on Mac)**
```bash
cd TicTrack
npm install
eas build --profile development --platform ios
```

**For Physical Device (Ad-hoc Distribution)**
```bash
# First, register your device
eas device:create

# Then build
eas build --profile preview --platform ios
```

**For Production (App Store/TestFlight)**
```bash
eas build --profile production --platform ios
```

#### Step 5: Install the Build

- After the build completes, you'll receive a download link
- For simulator builds: Download and drag the .app file into your iOS Simulator
- For device builds: Download the .ipa file and install via:
  - TestFlight (recommended for testing)
  - Apple Configurator 2
  - Xcode Devices window

### Method 2: Local Development Build

For rapid testing and development on a simulator or connected device.

#### Step 1: Install Dependencies
```bash
cd TicTrack
npm install
```

#### Step 2: Install CocoaPods Dependencies
```bash
# Generate the iOS folder if it doesn't exist
npx expo prebuild --platform ios

# Install iOS dependencies
cd ios
pod install
cd ..
```

#### Step 3: Run on Simulator
```bash
npx expo run:ios
```

This will:
1. Start the Metro bundler
2. Build the native iOS app
3. Launch the iOS Simulator
4. Install and run the app

#### Step 4: Run on Physical Device
```bash
# List available devices
xcrun simctl list devices

# Run on a specific device
npx expo run:ios --device
```

You'll need to:
1. Connect your iPhone/iPad via USB
2. Trust the computer on your device
3. Select your device when prompted

### Method 3: Xcode Build (Advanced)

For developers familiar with Xcode who want full control.

#### Step 1: Generate Native Project
```bash
cd TicTrack
npm install
npx expo prebuild --platform ios
```

#### Step 2: Open in Xcode
```bash
cd ios
open TicTrack.xcworkspace
```

**Note:** Always open the `.xcworkspace` file, NOT the `.xcodeproj` file.

#### Step 3: Configure Signing

1. In Xcode, select the project in the navigator
2. Select the "TicTrack" target
3. Go to "Signing & Capabilities"
4. Select your Team (Apple Developer Account)
5. Xcode will automatically create provisioning profiles

#### Step 4: Build and Run

1. Select your target device from the device dropdown
2. Click the Play button (▶️) or press Cmd+R
3. The app will build and install on your device

## Configuring Your App

### Update Bundle Identifier

If you want to use your own bundle identifier:

1. Edit `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.tictrack"
    }
  }
}
```

2. Rebuild the app

### App Icon and Splash Screen

The app already has an icon configured. To customize:

1. Replace `./assets/tictag_mark_red.png` with your own 1024x1024 PNG
2. Rebuild the app

## Permissions

The app requests the following iOS permissions:

- **Camera**: To scan business cards
- **Photo Library**: To select images from your photo library
- **Contacts**: To save scanned business card information
- **WhatsApp URL Scheme**: To send messages via WhatsApp

All permission descriptions are pre-configured in `app.json`.

## Troubleshooting

### "Unable to boot simulator"
```bash
# Reset the simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

### "No profiles for 'com.tictrack.app' were found"
1. Open Xcode
2. Go to Preferences > Accounts
3. Select your Apple ID
4. Click "Download Manual Profiles"

### "Command PhaseScriptExecution failed"
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

### "Metro bundler port already in use"
```bash
# Kill the existing process
lsof -ti:8081 | xargs kill -9

# Or change the port
npx expo start --port 8082
```

### App crashes on launch
1. Check the console logs in Xcode (Window > Devices and Simulators)
2. Ensure you've entered your Claude API key in Settings
3. Verify all permissions are granted on the device

## Testing on Real Devices

### TestFlight (Recommended)

1. Build with EAS:
```bash
eas build --profile production --platform ios
```

2. Submit to TestFlight:
```bash
eas submit --platform ios
```

3. In App Store Connect:
   - Go to TestFlight tab
   - Add internal or external testers
   - Testers will receive an email to install via TestFlight app

### Ad-hoc Distribution

1. Register test devices:
```bash
eas device:create
```

2. Build with device UDIDs:
```bash
eas build --profile preview --platform ios
```

3. Distribute the .ipa file to testers

## App Store Submission

### Prepare for Submission

1. Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.2.0",
    "ios": {
      "buildNumber": "1.2.0"
    }
  }
}
```

2. Prepare screenshots (required sizes):
   - 6.7" Display (iPhone 15 Pro Max): 1290 x 2796
   - 6.5" Display (iPhone 11 Pro Max): 1284 x 2778
   - 5.5" Display (iPhone 8 Plus): 1242 x 2208

3. Create App Store listing in App Store Connect

### Build and Submit

```bash
# Build for production
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

Follow the prompts to complete the submission.

### App Review Preparation

Prepare the following for Apple's review:

1. **Demo Account**: Create a test Claude API key for reviewers
2. **Demo Content**: Prepare sample business card images
3. **Privacy Policy**: Host a privacy policy (required for App Store)
4. **App Description**: Clear description of functionality
5. **Test Notes**: Explain how to use the app and any special requirements

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/ios.yml`:

```yaml
name: iOS Build
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install -g eas-cli
      - run: cd TicTrack && npm install
      - run: eas build --platform ios --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Performance Optimization

### Reduce Bundle Size

1. Enable Hermes (already configured):
```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

2. Analyze bundle:
```bash
npx react-native-bundle-visualizer
```

### Improve Startup Time

1. Optimize images in `assets/`
2. Use `react-native-fast-image` for remote images
3. Implement code splitting for large screens

## Support

For issues specific to:
- **Expo/EAS**: https://expo.dev/support
- **iOS Development**: https://developer.apple.com/support
- **TicTrack App**: Open an issue on GitHub

## Additional Resources

- [Expo iOS Documentation](https://docs.expo.dev/build/ios/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [React Native iOS Guide](https://reactnative.dev/docs/running-on-device)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

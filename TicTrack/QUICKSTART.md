# TicTrack - Quick Start Guide

## For Users: Installing the APK

1. **Get the APK file** (see Building section below)
2. **Transfer to your phone** via USB, email, or cloud storage
3. **Enable installation from unknown sources**:
   - Go to Settings > Security
   - Enable "Install unknown apps" for your file manager
4. **Install the APK** by tapping on it
5. **Grant permissions** when prompted
6. **Get your Claude API key** from https://console.anthropic.com
7. **Launch TicTrack** and enter your API key

## For Developers: Building the APK

### Fastest Method: EAS Build (Cloud)

```bash
cd TicTrack
npm install
npx eas login  # Create account at expo.dev if needed
npx eas build --platform android --profile production
```

Wait 5-10 minutes, then download the APK from the link provided.

### Local Build (If you have Android Studio)

```bash
cd TicTrack
npm install
export ANDROID_HOME=$HOME/Android/Sdk
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## First Time Setup

1. Launch TicTrack
2. Enter your Claude API key (get from console.anthropic.com)
3. Tap "Get Started"
4. Grant camera and contacts permissions

## How to Use

### Scan a Business Card

1. Tap camera icon or "Scan Card"
2. Position business card in frame
3. Tap capture button (or select from gallery)
4. Wait for AI processing (5-10 seconds)

### Review & Save

1. Review extracted information
2. Edit any fields if needed
3. Tap "Save" to add to contacts

### Generate WhatsApp Message

1. After saving, tap "Send WhatsApp Message"
2. Enter context (e.g., "We met at the tech conference")
3. Tap "Generate Message"
4. Review and edit AI-generated message
5. Select phone number
6. Tap "Send via WhatsApp"

## Troubleshooting

### Camera not working
- Grant camera permission in Settings > Apps > TicTrack > Permissions

### Contacts not saving
- Grant contacts permission in Settings > Apps > TicTrack > Permissions

### API errors
- Check your Claude API key is valid
- Ensure you have internet connection
- Check API credit balance at console.anthropic.com

### WhatsApp not opening
- Ensure WhatsApp is installed
- Check phone number format includes country code

## Tips

- **Best lighting**: Use good lighting for better OCR accuracy
- **Card orientation**: Hold card flat and parallel to phone
- **Multiple cards**: Process one card at a time for best results
- **Message context**: More context = better AI-generated messages
- **Phone numbers**: Include country code (e.g., +1 for US)

## API Costs

- OCR extraction: ~$0.01 per business card
- Message generation: ~$0.001 per message
- Average cost: ~$0.02 per complete workflow

## Support

For issues or feature requests, open an issue on GitHub.

# Camera Troubleshooting Guide

## New Camera Features (v2)

The updated camera implementation includes:

### 1. **Camera Ready Detection**
- Camera now shows "Camera warming up..." message while initializing
- Capture button is disabled until camera is ready
- Prevents errors from trying to capture before camera is ready

### 2. **Three Ways to Capture**
```
Option 1: Main Camera Button (center)
- Wait for "Camera warming up..." to disappear
- Tap the orange capture button

Option 2: Alternative Camera (bottom button)
- Uses expo-image-picker's camera API
- More reliable on some devices
- Click "📷 Alternative Camera (if main camera fails)"

Option 3: Gallery/Upload (side buttons)
- Upload existing photos
- Most reliable option
- Click "📁 Upload" or "🖼️ Gallery"
```

### 3. **Debug Information**
In development mode, you'll see real-time status messages at the top:
- "Camera ready"
- "Taking picture..."
- "Photo captured, processing..."
- Error messages with details

### 4. **Better Error Messages**
Errors now show:
- Specific error message (not just "failed to take picture")
- Quick action buttons to try Gallery instead
- Detailed console logging for debugging

## Troubleshooting Steps

### Issue: "Failed to take picture"

#### Step 1: Wait for Camera Ready
**Symptom:** Error immediately when tapping capture
**Solution:**
- Look for "Camera warming up..." message
- Wait until it disappears (usually 1-2 seconds)
- Capture button will be enabled (not faded) when ready

#### Step 2: Use Alternative Camera
**Symptom:** Main camera keeps failing
**Solution:**
- Tap "📷 Alternative Camera" button at the bottom
- This uses a different camera API that works better on some devices
- Should open your device's native camera app

#### Step 3: Use Gallery Upload
**Symptom:** Both camera methods fail
**Solution:**
- Take photo with your default camera app first
- Return to TicTrack
- Tap "🖼️ Gallery" or "📁 Upload"
- Select the business card photo
- Works 100% reliably

### Issue: Camera stays black or frozen

#### Solution 1: Restart App
1. Close TicTrack completely (swipe away from recents)
2. Wait 5 seconds
3. Reopen app
4. Camera should initialize fresh

#### Solution 2: Check Permissions
1. Go to Settings → Apps → TicTrack
2. Check Permissions
3. Ensure "Camera" is allowed
4. If denied, grant permission and restart app

#### Solution 3: Device Camera App
1. Open your phone's default camera app
2. Take a test photo
3. If that works, close it
4. Return to TicTrack and try again

### Issue: "Camera warming up..." never goes away

#### Solution 1: Wait Longer
- Some devices take 3-5 seconds to initialize
- Wait at least 10 seconds

#### Solution 2: Use Alternative Camera
- The alternative camera doesn't need warm-up
- Tap "📷 Alternative Camera" at bottom

#### Solution 3: Use Gallery
- Most reliable option
- No camera initialization needed

### Issue: Error message shows but is unclear

#### Development Mode
If you're running in development mode, check the debug badge at the top for:
- Specific error messages
- Current camera state
- Processing status

#### Check Console Logs
1. Connect device to computer
2. Run `npx react-native log-android` or `npx react-native log-ios`
3. Look for detailed error information
4. Common errors and solutions:

**"No photo URI returned"**
- Camera didn't save the photo
- Try Alternative Camera or Gallery

**"Photo file does not exist"**
- Camera saved photo but file was deleted
- Try again or use Gallery

**"takePictureAsync failed"**
- Camera API error
- Use Alternative Camera

## Recommended Workflow

For best results, follow this priority:

### Priority 1: Gallery Upload (Most Reliable)
```
1. Take photo with your phone's camera app
2. Open TicTrack
3. Tap "🖼️ Gallery"
4. Select business card photo
✅ Works 100% of the time
```

### Priority 2: Alternative Camera
```
1. Open TicTrack camera
2. Tap "📷 Alternative Camera" at bottom
3. Take photo in camera app
4. Confirm
✅ Works on most devices
```

### Priority 3: Main Camera
```
1. Open TicTrack camera
2. Wait for "Camera warming up..." to disappear
3. Tap center capture button
✅ Should work if camera is ready
```

## Platform-Specific Issues

### Samsung Galaxy S25 Ultra

**Known Issues:**
- Some Samsung devices have stricter camera API requirements
- May need to use Alternative Camera option

**Recommended:**
1. Use Alternative Camera button (works best)
2. Or use Gallery upload method

### General Android

**Camera Permission Issues:**
- Go to Settings → Apps → TicTrack → Permissions
- Enable Camera, Storage, and Photos

**Battery Optimization:**
- Some battery savers restrict camera access
- Temporarily disable battery optimization for TicTrack

## Still Having Issues?

### Quick Fixes
1. ✅ Try Alternative Camera button
2. ✅ Use Gallery upload
3. ✅ Restart the app
4. ✅ Check camera permissions
5. ✅ Update to latest app version

### Report Bug
If camera still fails with all three methods:

1. Note the exact error message
2. Note which method failed (main camera, alternative, or gallery)
3. Note your device model
4. Check console logs for technical details
5. Open GitHub issue with this information

### Workaround
**Best workaround while debugging:**
```
1. Take photos of business cards with default camera
2. Open TicTrack
3. Use "🖼️ Gallery" to upload
4. Process as normal
```

This is 100% reliable and bypasses all camera initialization issues.

## Technical Details

### Camera Implementation
- **Main Camera:** expo-camera CameraView component
- **Alternative Camera:** expo-image-picker launchCameraAsync
- **Gallery:** expo-image-picker launchImageLibraryAsync

### Error Handling
- Checks for camera ready state
- Validates photo URI exists
- Verifies file exists before reading
- Detailed error logging
- Graceful fallbacks to gallery

### Debug Mode
When running in development:
- Debug badge shows camera state
- Console logs all camera operations
- Error details logged to console
- Can track exactly where failures occur

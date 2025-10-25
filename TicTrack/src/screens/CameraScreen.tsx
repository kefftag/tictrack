import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../utils/colors';

interface CameraScreenProps {
  onCardScanned: (imageBase64: string, imageUri: string) => void;
  onBack: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onCardScanned,
  onBack,
}) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const cameraRef = useRef<CameraView>(null);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
    setDebugInfo('Camera ready');
    console.log('Camera is ready');
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    // Prevent multiple simultaneous captures
    if (isProcessing) {
      console.log('Already processing, ignoring tap');
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Camera Not Ready', 'Please wait for camera to initialize, then try again.');
      return;
    }

    if (!isCameraReady) {
      Alert.alert(
        'Camera Initializing',
        'Camera is still warming up. Please wait a moment and try again, or use the Gallery option.',
        [
          { text: 'Wait', style: 'cancel' },
          { text: 'Use Gallery', onPress: pickImage },
        ]
      );
      return;
    }

    try {
      setIsProcessing(true);
      setDebugInfo('Taking picture...');
      console.log('Starting takePictureAsync...');

      // Try with minimal options first
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        exif: false,
      });

      console.log('Photo captured:', photo);
      setDebugInfo('Photo captured, processing...');

      if (!photo || !photo.uri) {
        throw new Error('No photo URI returned from camera');
      }

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      console.log('File info:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('Photo file does not exist');
      }

      setDebugInfo('Reading file...');
      const base64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Base64 length:', base64.length);
      setDebugInfo('Processing complete');

      onCardScanned(base64, photo.uri);
    } catch (error: any) {
      console.error('Error taking picture:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });

      setIsProcessing(false);
      setDebugInfo(`Error: ${error?.message || 'Unknown error'}`);

      Alert.alert(
        'Camera Error',
        `Failed to capture photo: ${error?.message || 'Unknown error'}\n\nPlease use the Gallery option instead.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Gallery', onPress: pickImage },
        ]
      );
    }
  };

  const pickImage = async () => {
    try {
      setIsProcessing(true);
      setDebugInfo('Opening gallery...');

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant photo library access to upload images.');
        setIsProcessing(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setDebugInfo('Processing image from gallery...');
        const base64 = await FileSystem.readAsStringAsync(
          result.assets[0].uri,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        );
        onCardScanned(base64, result.assets[0].uri);
      } else {
        setIsProcessing(false);
        setDebugInfo('');
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      setIsProcessing(false);
      setDebugInfo('');
      Alert.alert('Error', `Failed to pick image: ${error?.message || 'Unknown error'}`);
    }
  };

  const takePhotoWithCamera = async () => {
    // Alternative: Use expo-image-picker's camera
    try {
      setIsProcessing(true);
      setDebugInfo('Opening camera via ImagePicker...');

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera access.');
        setIsProcessing(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setDebugInfo('Processing photo...');
        const base64 = await FileSystem.readAsStringAsync(
          result.assets[0].uri,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        );
        onCardScanned(base64, result.assets[0].uri);
      } else {
        setIsProcessing(false);
        setDebugInfo('');
      }
    } catch (error: any) {
      console.error('Error with camera picker:', error);
      setIsProcessing(false);
      setDebugInfo('');
      Alert.alert('Error', `Camera error: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        onCameraReady={handleCameraReady}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            {debugInfo && __DEV__ && (
              <View style={styles.debugBadge}>
                <Text style={styles.debugText}>{debugInfo}</Text>
              </View>
            )}
          </View>

          <View style={styles.guidebox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.bottomBar}>
            {!isCameraReady && (
              <View style={styles.loadingBadge}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Camera warming up...</Text>
              </View>
            )}
            <Text style={styles.instructions}>
              Position business card(s) within the frame
            </Text>
            <Text style={styles.subInstructions}>
              Supports multiple cards in one photo
            </Text>

            {/* Primary Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.pickButton}
                onPress={pickImage}
                disabled={isProcessing}
              >
                <Text style={styles.pickButtonText}>📁 Upload</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.captureButton,
                  (isProcessing || !isCameraReady) && styles.captureButtonDisabled,
                ]}
                onPress={takePicture}
                disabled={isProcessing || !isCameraReady}
              >
                {isProcessing ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickButton}
                onPress={pickImage}
                disabled={isProcessing}
              >
                <Text style={styles.pickButtonText}>🖼️ Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Alternative Camera Method */}
            <TouchableOpacity
              style={styles.alternativeButton}
              onPress={takePhotoWithCamera}
              disabled={isProcessing}
            >
              <Text style={styles.alternativeButtonText}>
                📷 Alternative Camera (if main camera fails)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: COLORS.text,
    fontSize: 18,
    paddingHorizontal: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topBar: {
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    backgroundColor: COLORS.overlayLight,
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  debugBadge: {
    backgroundColor: COLORS.overlay,
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  debugText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlay,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 14,
    marginLeft: 8,
  },
  guidebox: {
    alignSelf: 'center',
    width: '85%',
    aspectRatio: 1.6,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomBar: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.overlay,
  },
  instructions: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  subInstructions: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickButton: {
    backgroundColor: COLORS.backgroundTertiary,
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
  },
  alternativeButton: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alternativeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 20,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

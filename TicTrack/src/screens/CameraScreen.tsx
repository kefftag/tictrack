import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
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
  const cameraRef = useRef<CameraView>(null);

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

  // Take photo using CameraView directly
  const takePhotoWithCamera = async () => {
    if (isProcessing) return;
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo && photo.base64) {
        onCardScanned(photo.base64, photo.uri);
      } else {
        throw new Error('No base64 data received');
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setIsProcessing(false);
      Alert.alert(
        'Camera Error',
        `Failed to take photo: ${error.message}. Please try the Gallery option.`,
        [{ text: 'OK' }]
      );
    }
  };

  const pickImage = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant photo library access.');
        setIsProcessing(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true, // Get base64 directly
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        if (asset.base64) {
          onCardScanned(asset.base64, asset.uri);
        } else {
          throw new Error('No base64 data received');
        }
      } else {
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Gallery error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.guidebox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.bottomBar}>
            <Text style={styles.instructions}>
              Position business card(s) within the frame
            </Text>
            <Text style={styles.subInstructions}>
              Supports multiple cards in one photo
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={pickImage}
                disabled={isProcessing}
              >
                <Text style={styles.actionButtonText}>📁</Text>
                <Text style={styles.actionButtonLabel}>Upload</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                onPress={takePhotoWithCamera}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={COLORS.primary} size="large" />
                ) : (
                  <Text style={styles.cameraIcon}>📷</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={pickImage}
                disabled={isProcessing}
              >
                <Text style={styles.actionButtonText}>🖼️</Text>
                <Text style={styles.actionButtonLabel}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helpText}>
              Tap 📷 to take photo or use Gallery/Upload
            </Text>
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
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    fontSize: 36,
    marginBottom: 4,
  },
  actionButtonLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.text,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  cameraIcon: {
    fontSize: 48,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { COLORS } from '../utils/colors';
import { ClaudeService } from '../services/claudeService';
import { GoogleAuthService } from '../services/googleAuthService';

const API_KEY_STORAGE_KEY = '@tictrack_api_key';
const MESSAGE_CONTEXT_KEY = '@tictrack_message_context';

interface SettingsScreenProps {
  onApiKeySaved?: (apiKey: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onApiKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');
  const [messageContext, setMessageContext] = useState('');
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const googleAuthService = GoogleAuthService.getInstance();

  // Generate redirect URI with useProxy enabled
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  // Google OAuth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '640350728157-gtshl21afajfec7qm8kf20lp43ek7bpu.apps.googleusercontent.com', // Web Client ID
    androidClientId: '640350728157-aquqtlpar5rj7ndpiuhae6hibivg4q9u.apps.googleusercontent.com', // Android Client ID (for native features)
    iosClientId: '640350728157-aquqtlpar5rj7ndpiuhae6hibivg4q9u.apps.googleusercontent.com',
    redirectUri: redirectUri, // Explicitly set redirect URI with proxy
    scopes: [
      'https://www.googleapis.com/auth/contacts',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });

  useEffect(() => {
    loadApiKey();
    loadMessageContext();
    initializeGoogleAuth();
  }, []);

  useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  // Debug: Log the redirect URI being used
  useEffect(() => {
    if (request) {
      console.log('=== Google OAuth Debug Info ===');
      console.log('Redirect URI:', request.redirectUri);
      console.log('Client ID:', request.clientId);
      console.log('Response Type:', request.responseType);
      console.log('================================');
    }
  }, [request]);

  const loadApiKey = async () => {
    try {
      const savedKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      if (savedKey) {
        setApiKey(savedKey);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      Alert.alert('Success', 'API key saved successfully');
      if (onApiKeySaved) {
        onApiKeySaved(apiKey);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter your Claude API key to test the connection.');
      return;
    }

    setIsTesting(true);
    setConnectionStatus('idle');
    setConnectionError('');

    try {
      console.log('Testing Claude API connection...');
      const claudeService = new ClaudeService(apiKey);
      const result = await claudeService.testConnection();

      if (result.success) {
        console.log('✅ Connection test successful!');
        setConnectionStatus('success');
        await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        if (onApiKeySaved) {
          onApiKeySaved(apiKey);
        }
      } else {
        console.log('❌ Connection test failed:', result.error);
        setConnectionStatus('error');
        setConnectionError(result.error || 'Connection failed');
      }
    } catch (error: any) {
      console.error('❌ Connection test error:', error);
      setConnectionStatus('error');
      setConnectionError(error.message || 'Unknown error occurred');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearKey = async () => {
    Alert.alert(
      'Clear API Key',
      'Are you sure you want to clear the saved API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
              setApiKey('');
              setConnectionStatus('idle');
              setConnectionError('');
            } catch (error) {
              console.error('Error clearing API key:', error);
            }
          },
        },
      ]
    );
  };

  const loadMessageContext = async () => {
    try {
      const savedContext = await AsyncStorage.getItem(MESSAGE_CONTEXT_KEY);
      if (savedContext) {
        setMessageContext(savedContext);
      }
    } catch (error) {
      console.error('Error loading message context:', error);
    }
  };

  const saveMessageContext = async () => {
    try {
      await AsyncStorage.setItem(MESSAGE_CONTEXT_KEY, messageContext);
      Alert.alert('Success', 'Message context saved successfully');
    } catch (error) {
      console.error('Error saving message context:', error);
      Alert.alert('Error', 'Failed to save message context');
    }
  };

  const initializeGoogleAuth = async () => {
    try {
      await googleAuthService.initialize();
      const user = googleAuthService.getCurrentUser();
      setGoogleUser(user);
    } catch (error) {
      console.error('Error initializing Google auth:', error);
    }
  };

  const handleGoogleResponse = async () => {
    if (!response) return;

    console.log('=== Google OAuth Response ===');
    console.log('Response type:', response.type);
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('=============================');

    if (response.type === 'success') {
      setIsGoogleSigningIn(true);
      try {
        const { authentication } = response;

        console.log('Authentication object:', authentication);

        if (authentication?.accessToken) {
          // Save token and fetch user info
          const result = await googleAuthService.handleAuthResponse(response, async (code: string) => {
            // Exchange code for token using expo's hook
            return {
              accessToken: authentication.accessToken,
              refreshToken: authentication.refreshToken,
              expiresIn: authentication.expiresIn,
              tokenType: authentication.tokenType,
              idToken: authentication.idToken,
            };
          });

          if (result.success) {
            const user = googleAuthService.getCurrentUser();
            setGoogleUser(user);
            Alert.alert('Success', `Signed in as ${user?.email}`);
          } else {
            Alert.alert('Error', result.error || 'Failed to sign in');
          }
        }
      } catch (error: any) {
        console.error('Google sign in error:', error);
        Alert.alert('Error', error.message || 'Failed to sign in with Google');
      } finally {
        setIsGoogleSigningIn(false);
      }
    } else if (response.type === 'error') {
      console.error('OAuth error response:', response);
      Alert.alert('Error', 'Google authentication failed');
    } else {
      console.log('OAuth response type not handled:', response.type);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Error initiating Google sign in:', error);
      Alert.alert('Error', error.message || 'Failed to start Google sign in');
    }
  };

  const handleGoogleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Google?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await googleAuthService.signOut();
              setGoogleUser(null);
              Alert.alert('Success', 'Signed out of Google');
            } catch (error: any) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Claude API Configuration</Text>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>API Key</Text>
            {apiKey && (
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggleText}>
                  {showPassword ? '🙈 Hide' : '👁️ Show'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="sk-ant-..."
            placeholderTextColor={COLORS.textTertiary}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Get your API key from console.anthropic.com
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={saveApiKey}
          disabled={!apiKey.trim()}
        >
          <Text style={styles.primaryButtonText}>Save API Key</Text>
        </TouchableOpacity>

        {apiKey && (
          <>
            <TouchableOpacity
              onPress={handleTestConnection}
              style={styles.testButton}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            {connectionStatus === 'success' && (
              <View style={styles.statusContainer}>
                <Text style={styles.successText}>✅ Connected successfully!</Text>
              </View>
            )}

            {connectionStatus === 'error' && (
              <View style={styles.statusContainer}>
                <Text style={styles.errorText}>❌ Connection failed</Text>
                <Text style={styles.errorDetail}>{connectionError}</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleClearKey} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear Saved Key</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Google Contacts Integration</Text>
        <Text style={styles.sectionDescription}>
          Sign in with Google to save contacts directly to Google Contacts and sync across devices.
        </Text>

        {googleUser ? (
          <View style={styles.googleAccountContainer}>
            <View style={styles.googleUserInfo}>
              {googleUser.picture && (
                <Image source={{ uri: googleUser.picture }} style={styles.googleAvatar} />
              )}
              <View style={styles.googleUserDetails}>
                <Text style={styles.googleUserName}>{googleUser.name}</Text>
                <Text style={styles.googleUserEmail}>{googleUser.email}</Text>
              </View>
            </View>

            <View style={styles.googleStatusContainer}>
              <Text style={styles.googleStatusText}>✓ Connected</Text>
              <Text style={styles.googleStatusSubtext}>
                Contacts will be saved to Google Contacts
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleGoogleSignOut}
              style={styles.googleSignOutButton}
            >
              <Text style={styles.googleSignOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={styles.googleSignInButton}
              disabled={isGoogleSigningIn || !request}
            >
              {isGoogleSigningIn ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <>
                  <Text style={styles.googleSignInButtonIcon}>G</Text>
                  <Text style={styles.googleSignInButtonText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.googleHint}>
              Note: You'll need to configure Google OAuth client IDs in app.json for this to work.
              See documentation for setup instructions.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message Customization</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Default Message Context</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="E.g., I'm a business development manager interested in partnerships..."
            placeholderTextColor={COLORS.textTertiary}
            value={messageContext}
            onChangeText={setMessageContext}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            This context will be automatically included when generating WhatsApp messages
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={saveMessageContext}
        >
          <Text style={styles.primaryButtonText}>Save Message Context</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>TicTrack Business Card Scanner</Text>
        <Text style={styles.aboutText}>Version 1.0.0</Text>
        <Text style={styles.aboutTextSecondary}>
          Powered by Claude AI from Anthropic
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    backgroundColor: COLORS.backgroundSecondary,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
  testButton: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorDetail: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  clearButton: {
    marginTop: 10,
    padding: 6,
  },
  clearButtonText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  aboutTextSecondary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  googleAccountContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.backgroundSecondary,
  },
  googleUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  googleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  googleUserDetails: {
    flex: 1,
  },
  googleUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  googleUserEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  googleStatusContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginBottom: 12,
  },
  googleStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  googleStatusSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  googleSignOutButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  googleSignOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
  },
  googleSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  googleSignInButtonIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
    marginRight: 8,
    backgroundColor: COLORS.background,
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
  },
  googleSignInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.background,
  },
  googleHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { COLORS } from '../utils/colors';
import { ClaudeService } from '../services/claudeService';

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

  useEffect(() => {
    loadApiKey();
    loadMessageContext();
  }, []);

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
      Alert.alert('Success', 'Default message context saved successfully');
    } catch (error) {
      console.error('Error saving message context:', error);
      Alert.alert('Error', 'Failed to save message context');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const appVersion = Constants.expoConfig?.version || '1.0.0';

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
        <Text style={styles.sectionTitle}>Message Customization</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Default Message Context</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="E.g., I'm a business development manager interested in partnerships..."
            placeholderTextColor={COLORS.textTertiary}
            value={messageContext}
            onChangeText={setMessageContext}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            This context will be automatically included when generating messages (unless overridden by temporary context on home screen)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={saveMessageContext}
        >
          <Text style={styles.primaryButtonText}>Save Default Context</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>TicTrack Business Card Scanner</Text>
        <Text style={styles.aboutText}>Version {appVersion}</Text>
        <Text style={styles.aboutTextSecondary}>
          Powered by Tictag AI
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
    lineHeight: 16,
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
});

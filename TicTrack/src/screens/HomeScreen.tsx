import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/colors';
import { TicTagLogo } from '../components/TicTagLogo';
import { ClaudeService } from '../services/claudeService';

const API_KEY_STORAGE_KEY = '@tictrack_api_key';
export const TEMP_CONTEXT_STORAGE_KEY = '@tictrack_temp_context';
export const EVENT_STORAGE_KEY = '@tictrack_event';

interface HomeScreenProps {
  onStartScan: (apiKey: string) => void;
  onStartQuickMessage: (apiKey: string) => void;
  onViewContacts: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartScan, onStartQuickMessage, onViewContacts }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');
  const [tempContext, setTempContext] = useState('');
  const [event, setEvent] = useState('');

  useEffect(() => {
    loadApiKey();
    loadTempContext();
    loadEvent();
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

  const loadTempContext = async () => {
    try {
      const savedContext = await AsyncStorage.getItem(TEMP_CONTEXT_STORAGE_KEY);
      if (savedContext) {
        setTempContext(savedContext);
      }
    } catch (error) {
      console.error('Error loading temp context:', error);
    }
  };

  const loadEvent = async () => {
    try {
      const savedEvent = await AsyncStorage.getItem(EVENT_STORAGE_KEY);
      if (savedEvent) {
        setEvent(savedEvent);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const saveTempContext = async () => {
    try {
      await AsyncStorage.setItem(TEMP_CONTEXT_STORAGE_KEY, tempContext);
      Alert.alert('Success', 'Temporary context saved successfully');
    } catch (error) {
      console.error('Error saving temp context:', error);
      Alert.alert('Error', 'Failed to save temporary context');
    }
  };

  const saveEvent = async () => {
    try {
      await AsyncStorage.setItem(EVENT_STORAGE_KEY, event);
      Alert.alert('Success', 'Event saved successfully');
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const clearEvent = async () => {
    Alert.alert(
      'Clear Event',
      'Are you sure you want to clear the event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(EVENT_STORAGE_KEY);
              setEvent('');
              Alert.alert('Success', 'Event cleared');
            } catch (error) {
              console.error('Error clearing event:', error);
              Alert.alert('Error', 'Failed to clear event');
            }
          },
        },
      ]
    );
  };

  const clearTempContext = async () => {
    Alert.alert(
      'Clear Temporary Context',
      'Are you sure you want to clear the temporary message context?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(TEMP_CONTEXT_STORAGE_KEY);
              setTempContext('');
              Alert.alert('Success', 'Temporary context cleared');
            } catch (error) {
              console.error('Error clearing temp context:', error);
              Alert.alert('Error', 'Failed to clear temporary context');
            }
          },
        },
      ]
    );
  };

  const saveApiKey = async (key: string) => {
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleScanCard = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter your Claude API key to continue.');
      return;
    }

    await saveApiKey(apiKey);
    onStartScan(apiKey);
  };

  const handleQuickMessage = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter your Claude API key to continue.');
      return;
    }

    await saveApiKey(apiKey);
    onStartQuickMessage(apiKey);
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
        await saveApiKey(apiKey);
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TicTagLogo size="large" />
        <Text style={styles.subtitle}>Business Card Scanner</Text>
      </View>

      <View style={styles.eventContainer}>
        <Text style={styles.eventTitle}>Event</Text>
        <Text style={styles.eventHint}>
          Specify which event you're attending. Contacts will be tagged with this event.
        </Text>
        <TextInput
          style={styles.eventInput}
          placeholder="E.g., Tech Conference 2025, CES Las Vegas, Company Summit..."
          placeholderTextColor={COLORS.textTertiary}
          value={event}
          onChangeText={setEvent}
          autoCapitalize="words"
        />
        <View style={styles.eventButtons}>
          <TouchableOpacity
            style={[styles.eventButton, styles.saveButton]}
            onPress={saveEvent}
          >
            <Text style={styles.saveButtonText}>💾 Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.eventButton, styles.clearEventButton]}
            onPress={clearEvent}
            disabled={!event}
          >
            <Text style={[styles.clearEventButtonText, !event && styles.disabledText]}>
              🗑 Clear
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contextContainer}>
        <Text style={styles.contextTitle}>Temporary Message Context</Text>
        <Text style={styles.contextHint}>
          This context will be added to all generated messages and takes priority over the default context in Settings.
        </Text>
        <TextInput
          style={styles.contextInput}
          placeholder="E.g., I'm attending Tech Conference 2025, interested in AI partnerships..."
          placeholderTextColor={COLORS.textTertiary}
          value={tempContext}
          onChangeText={setTempContext}
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />
        <View style={styles.contextButtons}>
          <TouchableOpacity
            style={[styles.contextButton, styles.saveButton]}
            onPress={saveTempContext}
          >
            <Text style={styles.saveButtonText}>💾 Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contextButton, styles.clearContextButton]}
            onPress={clearTempContext}
            disabled={!tempContext}
          >
            <Text style={[styles.clearContextButtonText, !tempContext && styles.disabledText]}>
              🗑 Clear
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Claude API Key</Text>
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

      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Choose an option:</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleScanCard}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📸</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Scan Business Card</Text>
            <Text style={styles.actionDescription}>
              Take photo or upload card images{'\n'}
              Extract contact info with AI{'\n'}
              Save directly to contacts
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleQuickMessage}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>💬</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Quick Message</Text>
            <Text style={styles.actionDescription}>
              Skip the camera{'\n'}
              Generate WhatsApp follow-up{'\n'}
              Enter contact details manually
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={onViewContacts}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📋</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Saved Contacts</Text>
            <Text style={styles.actionDescription}>
              View all saved contacts{'\n'}
              Sort by date or name{'\n'}
              Manage contact history
            </Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Powered by Tictag AI • Your API key is stored securely
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  inputContainer: {
    marginBottom: 24,
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
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  testButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
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
  eventContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  eventHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  eventInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    marginBottom: 12,
  },
  eventButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  eventButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearEventButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearEventButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  contextContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  contextHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  contextInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  contextButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contextButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '600',
  },
  clearContextButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearContextButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionArrow: {
    fontSize: 28,
    color: COLORS.primary,
    marginLeft: 12,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 20,
  },
});

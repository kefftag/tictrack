import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/colors';

const API_KEY_STORAGE_KEY = '@tictrack_api_key';

interface HomeScreenProps {
  onStart: (apiKey: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadApiKey();
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

  const saveApiKey = async (key: string) => {
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleStart = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter your Claude API key to continue.');
      return;
    }

    await saveApiKey(apiKey);
    onStart(apiKey);
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
            } catch (error) {
              console.error('Error clearing API key:', error);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TicTrack</Text>
        <Text style={styles.subtitle}>Business Card Scanner</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📸 Scan multiple business cards{'\n'}
          🤖 AI-powered data extraction{'\n'}
          📱 Save directly to contacts{'\n'}
          💬 Generate WhatsApp follow-ups
        </Text>
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
          <TouchableOpacity onPress={handleClearKey} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Saved Key</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Start Scanning</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Your API key is stored securely on your device
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  infoBox: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 24,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 28,
    color: COLORS.text,
    textAlign: 'left',
  },
  inputContainer: {
    marginBottom: 30,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: COLORS.backgroundSecondary,
    color: COLORS.text,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  clearButton: {
    marginTop: 12,
    padding: 8,
  },
  clearButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});

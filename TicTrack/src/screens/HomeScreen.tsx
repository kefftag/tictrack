import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

interface HomeScreenProps {
  onStart: (apiKey: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  const [apiKey, setApiKey] = useState('');

  const handleStart = () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter your Claude API key to continue.');
      return;
    }
    onStart(apiKey);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TicTrack</Text>
      <Text style={styles.subtitle}>Business Card Scanner</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Scan business cards, extract contact information, and generate personalized follow-up messages with Claude AI.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Claude API Key</Text>
        <TextInput
          style={styles.input}
          placeholder="sk-ant-..."
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>
          Get your API key from console.anthropic.com
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 40,
    color: '#64748b',
  },
  infoBox: {
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

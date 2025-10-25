import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BusinessCardData } from '../types';

interface SuccessScreenProps {
  contact: BusinessCardData;
  onSendMessage: () => void;
  onScanAnother: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  contact,
  onSendMessage,
  onScanAnother,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✓</Text>
        </View>
        <Text style={styles.title}>Contact Saved!</Text>
        <Text style={styles.message}>
          {contact.name} has been added to your contacts.
        </Text>

        <TouchableOpacity style={styles.button} onPress={onSendMessage}>
          <Text style={styles.buttonText}>Send WhatsApp Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onScanAnother}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Scan Another Card
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  secondaryButtonText: {
    color: '#2563eb',
  },
});

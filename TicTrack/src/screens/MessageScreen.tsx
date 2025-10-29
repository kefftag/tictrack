import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BusinessCardData } from '../types';
import { sendEmail, formatAsHTML, generateEmailSubject, isValidEmail } from '../utils/emailUtils';
import { sendTelegramMessage, sendContactToTictagBot } from '../utils/telegramUtils';
import { COLORS } from '../utils/colors';

interface MessageScreenProps {
  contact: BusinessCardData;
  onGenerateMessage: (context: string) => Promise<string>;
  onSendMessage: (phoneNumber: string, message: string) => void;
  onBack: () => void;
}

export const MessageScreen: React.FC<MessageScreenProps> = ({
  contact,
  onGenerateMessage,
  onSendMessage,
  onBack,
}) => {
  const [context, setContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<string>(
    contact.mobile || contact.phone || ''
  );

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const message = await onGenerateMessage(context);
      setGeneratedMessage(message);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate message. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    if (!generatedMessage.trim()) {
      Alert.alert('No Message', 'Please generate a message first.');
      return;
    }

    if (!selectedPhone.trim()) {
      Alert.alert('No Phone Number', 'Please select or enter a phone number.');
      return;
    }

    try {
      onSendMessage(selectedPhone, generatedMessage);
    } catch (error: any) {
      console.error('Error sending WhatsApp:', error);
      Alert.alert('Error', error.message || 'Failed to open WhatsApp');
    }
  };

  const handleSendEmail = async () => {
    if (!generatedMessage.trim()) {
      Alert.alert('No Message', 'Please generate a message first.');
      return;
    }

    const email = contact?.email || (contact?.emails && contact.emails[0]?.email);
    if (!email || !isValidEmail(email)) {
      Alert.alert('No Email', 'This contact has no valid email address.');
      return;
    }

    try {
      const subject = generateEmailSubject(contact?.name || 'there', context);
      const htmlBody = formatAsHTML(generatedMessage, contact?.name || 'there');

      const result = await sendEmail(email, subject, htmlBody, true);

      if (result.success) {
        Alert.alert('Success', 'Email client opened. Please send the email.');
      } else {
        Alert.alert('Error', result.error || 'Failed to open email client');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      Alert.alert('Error', error.message || 'Failed to send email');
    }
  };

  const handleSendTelegram = async () => {
    if (!generatedMessage.trim()) {
      Alert.alert('No Message', 'Please generate a message first.');
      return;
    }

    if (!selectedPhone.trim()) {
      Alert.alert('No Phone Number', 'Please select or enter a phone number.');
      return;
    }

    try {
      await sendTelegramMessage(selectedPhone, generatedMessage);
    } catch (error: any) {
      console.error('Error sending Telegram:', error);
      Alert.alert('Error', error.message || 'Failed to open Telegram');
    }
  };

  const handleSendToTictagBot = async () => {
    try {
      await sendContactToTictagBot(contact);
    } catch (error: any) {
      console.error('Error sending to Tictag Bot:', error);
      Alert.alert('Error', error.message || 'Failed to open Telegram');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send Message</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          {contact.company && (
            <Text style={styles.contactCompany}>{contact.company}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context for Message (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={context}
            onChangeText={setContext}
            placeholder="Example: I'd like to discuss potential collaboration on AI projects. (Optional - Event and settings context will be used)"
            multiline={true}
            numberOfLines={4}
          />
          <Text style={styles.hint}>
            Optional: Add additional context. Event field, temporary context, and settings context are already included.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isGenerating && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate Message</Text>
          )}
        </TouchableOpacity>

        {generatedMessage !== '' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Generated Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={generatedMessage}
                onChangeText={setGeneratedMessage}
                multiline={true}
                numberOfLines={6}
              />
              <Text style={styles.hint}>
                You can edit the message before sending.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phone Number</Text>
              <View style={styles.phoneOptions}>
                {contact.mobile && (
                  <TouchableOpacity
                    style={[
                      styles.phoneOption,
                      selectedPhone === contact.mobile &&
                        styles.phoneOptionSelected,
                    ]}
                    onPress={() => setSelectedPhone(contact.mobile!)}
                  >
                    <Text style={styles.phoneLabel}>Mobile</Text>
                    <Text style={styles.phoneNumber}>{contact.mobile}</Text>
                  </TouchableOpacity>
                )}
                {contact.phone && (
                  <TouchableOpacity
                    style={[
                      styles.phoneOption,
                      selectedPhone === contact.phone &&
                        styles.phoneOptionSelected,
                    ]}
                    onPress={() => setSelectedPhone(contact.phone!)}
                  >
                    <Text style={styles.phoneLabel}>Phone</Text>
                    <Text style={styles.phoneNumber}>{contact.phone}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                value={selectedPhone}
                onChangeText={setSelectedPhone}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.whatsappButton]}
                onPress={handleSend}
              >
                <Text style={styles.buttonText}>📱 WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.emailButton]}
                onPress={handleSendEmail}
              >
                <Text style={styles.buttonText}>📧 Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.telegramButton]}
                onPress={handleSendTelegram}
              >
                <Text style={styles.buttonText}>✈️ Telegram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.botButton]}
                onPress={handleSendToTictagBot}
              >
                <Text style={styles.buttonText}>🤖 Tictag Bot</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  contactInfo: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  contactName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  contactCompany: {
    fontSize: 16,
    color: '#64748b',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
  },
  emailButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  telegramButton: {
    flex: 1,
    backgroundColor: '#0088cc',
  },
  botButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
  },
  phoneOptions: {
    marginBottom: 12,
  },
  phoneOption: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  phoneOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  phoneLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
});

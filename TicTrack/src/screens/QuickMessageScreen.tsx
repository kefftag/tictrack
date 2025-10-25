import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../utils/colors';

interface QuickMessageScreenProps {
  onGenerateMessage: (contactName: string, context: string) => Promise<string>;
  onSendMessage: (phoneNumber: string, message: string) => void;
  onBack: () => void;
}

export const QuickMessageScreen: React.FC<QuickMessageScreenProps> = ({
  onGenerateMessage,
  onSendMessage,
  onBack,
}) => {
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [context, setContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!contactName.trim()) {
      Alert.alert('Name Required', 'Please enter the contact name.');
      return;
    }

    if (!context.trim()) {
      Alert.alert('Context Required', 'Please provide some context for the message.');
      return;
    }

    try {
      setIsGenerating(true);
      const message = await onGenerateMessage(contactName, context);
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

    if (!phoneNumber.trim()) {
      Alert.alert('Phone Number Required', 'Please enter a phone number.');
      return;
    }

    onSendMessage(phoneNumber, generatedMessage);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quick Message</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💬 Generate AI-powered WhatsApp messages{'\n'}
            No card scanning required!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Name *</Text>
            <TextInput
              style={styles.input}
              value={contactName}
              onChangeText={setContactName}
              placeholder="John Doe"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="phone-pad"
            />
            <Text style={styles.hint}>Include country code (e.g., +1 for US)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Context *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={context}
            onChangeText={setContext}
            placeholder="Example: We met at the tech conference yesterday. I'd like to discuss potential collaboration on AI projects."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.hint}>
            Provide context about how you met and what you'd like to discuss.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isGenerating && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.buttonText}>✨ Generate Message with AI</Text>
          )}
        </TouchableOpacity>

        {generatedMessage !== '' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Generated Message</Text>
              <View style={styles.messagePreview}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={generatedMessage}
                  onChangeText={setGeneratedMessage}
                  multiline
                  numberOfLines={6}
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
              <Text style={styles.hint}>
                You can edit the message before sending.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.sendButton]}
              onPress={handleSend}
            >
              <Text style={styles.buttonText}>📱 Send via WhatsApp</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 20,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sendButton: {
    backgroundColor: '#25D366', // WhatsApp green
  },
  messagePreview: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: 8,
    padding: 4,
  },
  bottomPadding: {
    height: 40,
  },
});

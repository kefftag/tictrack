import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { ContactsStorage, SavedContact, MessageHistory } from '../services/contactsStorage';
import { COLORS } from '../utils/colors';
import { generateVCF, generateVCFFilename } from '../utils/vcfUtils';
import { sendEmail, formatAsHTML, generateEmailSubject, isValidEmail } from '../utils/emailUtils';

interface ContactDetailScreenProps {
  contactId: string;
  onBack: () => void;
  onGenerateMessage: (context: string) => Promise<string>;
  onSendMessage: (phoneNumber: string, message: string) => Promise<void>;
}

export const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({
  contactId,
  onBack,
  onGenerateMessage,
  onSendMessage,
}) => {
  const [contact, setContact] = useState<SavedContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageContext, setMessageContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContact, setEditedContact] = useState<SavedContact | null>(null);

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      setIsLoading(true);
      const loadedContact = await ContactsStorage.getContactById(contactId);
      setContact(loadedContact);
    } catch (error) {
      console.error('Error loading contact:', error);
      Alert.alert('Error', 'Failed to load contact details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMessage = async () => {
    if (!messageContext.trim()) {
      Alert.alert('Context Required', 'Please enter a context for the message.');
      return;
    }

    setIsGenerating(true);
    try {
      const message = await onGenerateMessage(messageContext);
      setGeneratedMessage(message);

      // Save message to contact history
      if (contact) {
        await ContactsStorage.addMessageToContact(
          contact.id,
          message,
          messageContext,
          false
        );
        // Reload contact to show updated message history
        await loadContact();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!generatedMessage.trim()) {
      Alert.alert('No Message', 'Please generate a message first.');
      return;
    }

    const phoneNumber = contact?.mobile || contact?.phone;
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This contact has no phone number.');
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(phoneNumber, generatedMessage);

      // Update message as sent
      if (contact && contact.messages && contact.messages.length > 0) {
        // Find the most recent message (should be the one we just generated)
        const contacts = await ContactsStorage.getAllContacts();
        const contactIndex = contacts.findIndex(c => c.id === contact.id);
        if (contactIndex !== -1 && contacts[contactIndex].messages) {
          contacts[contactIndex].messages![0].sentViaWhatsApp = true;
          await ContactsStorage.updateContact(contact.id, contacts[contactIndex]);
          await loadContact();
        }
      }

      Alert.alert('Success', 'Message sent to WhatsApp!');
      setGeneratedMessage('');
      setMessageContext('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const createVCFFile = async () => {
    if (!contact || !contact.name) {
      throw new Error('Contact must have a name to export');
    }

    const vcfContent = generateVCF(contact);
    if (!vcfContent) {
      throw new Error('Failed to generate contact card data');
    }

    const filename = generateVCFFilename(contact);
    const dir = new Directory(Paths.cache, 'vcf');

    try {
      dir.create();
    } catch (dirError) {
      // Directory might already exist
    }

    const file = new File(dir, filename);
    try {
      file.create();
    } catch (fileError) {
      // File might already exist - we'll overwrite it
    }

    await file.write(vcfContent);
    return file;
  };

  const handleOpenVCF = async () => {
    if (!contact) {
      Alert.alert('Error', 'No contact data available');
      return;
    }

    try {
      const file = await createVCFFile();

      // Use Sharing API which handles content:// URIs automatically on Android
      // This works with the new File/Directory API without deprecated methods
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/vcard',
          dialogTitle: 'Open with Contacts',
          UTI: 'public.vcard',
        });
      } else {
        Alert.alert(
          'Not Available',
          'Unable to open contact card. Please try the Share Contact button instead.'
        );
      }
    } catch (error: any) {
      console.error('Error opening VCF:', error);
      Alert.alert('Error', `Could not open contact card: ${error.message || 'Unknown error'}`);
    }
  };

  const handleShareVCF = async () => {
    if (!contact) {
      Alert.alert('Error', 'No contact data available');
      return;
    }

    try {
      const file = await createVCFFile();

      // Share the VCF file via share sheet
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/vcard',
          dialogTitle: 'Share Contact',
          UTI: 'public.vcard',
        });
      } else {
        Alert.alert('Not Available', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      console.error('Error sharing VCF:', error);
      Alert.alert('Error', `Could not share contact: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSendEmail = async () => {
    if (!generatedMessage.trim()) {
      Alert.alert('No Message', 'Please generate a message first.');
      return;
    }

    if (!contact) {
      Alert.alert('Error', 'No contact data available');
      return;
    }

    const email = contact?.email || (contact?.emails && contact.emails[0]?.email);
    if (!email || !isValidEmail(email)) {
      Alert.alert('No Email', 'This contact has no valid email address.');
      return;
    }

    try {
      const subject = generateEmailSubject(contact?.name || 'there', messageContext);
      const htmlBody = formatAsHTML(generatedMessage, contact?.name || 'there');

      const result = await sendEmail(email, subject, htmlBody, true);

      if (result.success) {
        // Save message to history with email flag
        if (contact) {
          await ContactsStorage.addMessageToContact(
            contact.id,
            generatedMessage,
            messageContext,
            false // Not WhatsApp, it's email
          );
          await loadContact();
        }
        Alert.alert('Success', 'Email client opened. Please send the email.');
      } else {
        Alert.alert('Error', result.error || 'Failed to open email client');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      Alert.alert('Error', error.message || 'Failed to send email');
    }
  };

  const handleEditContact = () => {
    if (!contact) return;

    setEditedContact({ ...contact });
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editedContact || !contact) return;

    try {
      await ContactsStorage.updateContact(contact.id, editedContact);
      setContact(editedContact);
      setIsEditMode(false);
      Alert.alert('Success', 'Contact updated successfully');
    } catch (error: any) {
      console.error('Error updating contact:', error);
      Alert.alert('Error', error.message || 'Failed to update contact');
    }
  };

  const handleCancelEdit = () => {
    setEditedContact(null);
    setIsEditMode(false);
  };

  const handleDeleteContact = () => {
    if (!contact) return;

    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ContactsStorage.deleteContact(contact.id);
              Alert.alert('Success', 'Contact deleted', [
                {
                  text: 'OK',
                  onPress: onBack,
                },
              ]);
            } catch (error: any) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', error.message || 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const updateEditField = (field: keyof SavedContact, value: any) => {
    if (!editedContact) return;
    setEditedContact({
      ...editedContact,
      [field]: value,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading || !contact) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Contact Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={isEditMode ? handleCancelEdit : onBack}>
          <Text style={styles.backButton}>{isEditMode ? '✕ Cancel' : '← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Contact' : 'Contact Details'}</Text>
        {!isEditMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEditContact} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>✎ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteContact} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, styles.deleteText]}>🗑</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleSaveEdit} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, styles.saveText]}>✓ Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.infoCard}>
            {/* Name Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Name *</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.name || ''}
                  onChangeText={(text) => updateEditField('name', text)}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            ) : (
              <Text style={styles.contactName}>{contact.name || 'No Name'}</Text>
            )}

            {/* Company Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Company</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.company || ''}
                  onChangeText={(text) => updateEditField('company', text)}
                  placeholder="Company Name"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            ) : contact.company ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Company:</Text>
                <Text style={styles.infoValue}>{contact.company}</Text>
              </View>
            ) : null}

            {/* Title Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Title</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.title || ''}
                  onChangeText={(text) => updateEditField('title', text)}
                  placeholder="Job Title"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            ) : contact.title ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Title:</Text>
                <Text style={styles.infoValue}>{contact.title}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Email</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.email || ''}
                  onChangeText={(text) => updateEditField('email', text)}
                  placeholder="email@example.com"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : contact.email ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{contact.email}</Text>
              </View>
            ) : null}

            {/* Phone Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Phone</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.phone || ''}
                  onChangeText={(text) => updateEditField('phone', text)}
                  placeholder="Phone Number"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
            ) : contact.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{contact.phone}</Text>
              </View>
            ) : null}

            {/* Mobile Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Mobile</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.mobile || ''}
                  onChangeText={(text) => updateEditField('mobile', text)}
                  placeholder="Mobile Number"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
            ) : contact.mobile ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile:</Text>
                <Text style={styles.infoValue}>{contact.mobile}</Text>
              </View>
            ) : null}

            {/* Website Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Website</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.website || ''}
                  onChangeText={(text) => updateEditField('website', text)}
                  placeholder="www.example.com"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            ) : contact.website ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Website:</Text>
                <Text style={styles.infoValue}>{contact.website}</Text>
              </View>
            ) : null}

            {/* Address Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Address</Text>
                <TextInput
                  style={[styles.editInput, styles.multilineInput]}
                  value={editedContact?.address || ''}
                  onChangeText={(text) => updateEditField('address', text)}
                  placeholder="Street Address"
                  placeholderTextColor={COLORS.textTertiary}
                  multiline={true}
                  numberOfLines={2}
                />
              </View>
            ) : contact.address ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{contact.address}</Text>
              </View>
            ) : null}

            {/* LinkedIn Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>LinkedIn</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.linkedin || ''}
                  onChangeText={(text) => updateEditField('linkedin', text)}
                  placeholder="LinkedIn Profile URL"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="none"
                />
              </View>
            ) : contact.linkedin ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>LinkedIn:</Text>
                <Text style={styles.infoValue}>{contact.linkedin}</Text>
              </View>
            ) : null}

            {/* Twitter Field */}
            {isEditMode ? (
              <View style={styles.editFieldGroup}>
                <Text style={styles.editLabel}>Twitter</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedContact?.twitter || ''}
                  onChangeText={(text) => updateEditField('twitter', text)}
                  placeholder="@username or Twitter URL"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="none"
                />
              </View>
            ) : contact.twitter ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Twitter:</Text>
                <Text style={styles.infoValue}>{contact.twitter}</Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Saved: {formatDate(contact.savedAt)}</Text>
            </View>
          </View>

          {/* VCF Export Buttons */}
          <View style={styles.vcfButtonRow}>
            <TouchableOpacity
              style={[styles.vcfButton, styles.vcfButtonPrimary]}
              onPress={handleOpenVCF}
            >
              <Text style={styles.vcfButtonText}>📇 Open VCF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.vcfButton, styles.vcfButtonSecondary]}
              onPress={handleShareVCF}
            >
              <Text style={styles.vcfButtonTextSecondary}>📤 Share Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this contact..."
              placeholderTextColor={COLORS.textTertiary}
              value={contact.notes || ''}
              onChangeText={async (text) => {
                const updatedContact = { ...contact, notes: text };
                setContact(updatedContact);
                await ContactsStorage.updateContact(contact.id, updatedContact);
              }}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Generate Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate Message</Text>

          <View style={styles.messageCard}>
            <Text style={styles.inputLabel}>Message Context</Text>
            <TextInput
              style={styles.contextInput}
              placeholder="E.g., Follow up from networking event, Discuss partnership opportunity..."
              placeholderTextColor={COLORS.textTertiary}
              value={messageContext}
              onChangeText={setMessageContext}
              multiline={true}
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
              onPress={handleGenerateMessage}
              disabled={isGenerating || !messageContext.trim()}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.generateButtonText}>✨ Generate Message</Text>
              )}
            </TouchableOpacity>

            {generatedMessage && (
              <>
                <Text style={styles.inputLabel}>Generated Message</Text>
                <View style={styles.messagePreview}>
                  <Text style={styles.messageText}>{generatedMessage}</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.sendButton, isSending && styles.buttonDisabled]}
                    onPress={handleSendMessage}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color={COLORS.text} />
                    ) : (
                      <Text style={styles.sendButtonText}>📱 WhatsApp</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.emailButton, isSending && styles.buttonDisabled]}
                    onPress={handleSendEmail}
                    disabled={isSending || !contact.email}
                  >
                    <Text style={styles.emailButtonText}>📧 Email</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Message History */}
        {contact.messages && contact.messages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message History ({contact.messages.length})</Text>

            {contact.messages.map((msg: MessageHistory) => (
              <View key={msg.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{formatDate(msg.generatedAt)}</Text>
                  {msg.sentViaWhatsApp && (
                    <View style={styles.sentBadge}>
                      <Text style={styles.sentBadgeText}>✓ Sent</Text>
                    </View>
                  )}
                </View>

                {msg.context && (
                  <Text style={styles.historyContext}>Context: {msg.context}</Text>
                )}

                <View style={styles.historyMessage}>
                  <Text style={styles.historyMessageText}>{msg.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  metaRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  messageCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  contextInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.backgroundTertiary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  messagePreview: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sendButton: {
    flex: 1,
    backgroundColor: COLORS.whatsapp,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emailButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emailButtonText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '700',
  },
  vcfButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  vcfButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  vcfButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  vcfButtonSecondary: {
    backgroundColor: COLORS.backgroundSecondary,
    borderColor: COLORS.border,
  },
  vcfButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '600',
  },
  vcfButtonTextSecondary: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  notesCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesInput: {
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  historyCard: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sentBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sentBadgeText: {
    fontSize: 11,
    color: COLORS.background,
    fontWeight: '700',
  },
  historyContext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  historyMessage: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: 10,
  },
  historyMessageText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  deleteText: {
    color: COLORS.error,
  },
  saveText: {
    color: COLORS.success,
  },
  contactNameInput: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
  },
  editFieldGroup: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
});

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from './src/navigation/TabNavigator';
import { CameraScreen } from './src/screens/CameraScreen';
import { CardSelectionScreen } from './src/screens/CardSelectionScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { MessageScreen } from './src/screens/MessageScreen';
import { SuccessScreen } from './src/screens/SuccessScreen';
import { ContactDetailScreen } from './src/screens/ContactDetailScreen';
import { ClaudeService } from './src/services/claudeService';
import { ContactsStorage } from './src/services/contactsStorage';
import {
  parseBusinessCardToContact,
  saveContactToPhone,
} from './src/utils/contactUtils';
import { sendWhatsAppMessage, formatPhoneNumber } from './src/utils/whatsappUtils';
import { BusinessCardData } from './src/types';
import { COLORS } from './src/utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE_KEY = '@tictrack_api_key';
const MESSAGE_CONTEXT_KEY = '@tictrack_message_context';

type Screen =
  | 'tabs'
  | 'camera'
  | 'selection'
  | 'review'
  | 'success'
  | 'message'
  | 'contactDetail';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('tabs');
  const [claudeService, setClaudeService] = useState<ClaudeService | null>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [extractedCards, setExtractedCards] = useState<BusinessCardData[]>([]);
  const [currentCardData, setCurrentCardData] = useState<BusinessCardData>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedContact, setSavedContact] = useState<BusinessCardData>({});
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  const initializeClaudeService = async () => {
    try {
      const apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      if (apiKey) {
        const service = new ClaudeService(apiKey);
        setClaudeService(service);
        return service;
      }
      return null;
    } catch (error) {
      console.error('Error initializing Claude service:', error);
      return null;
    }
  };

  const handleStartScan = async () => {
    const service = await initializeClaudeService();
    if (service) {
      setClaudeService(service);
      setCurrentScreen('camera');
    } else {
      Alert.alert('API Key Required', 'Please enter your Claude API key in Settings first.');
    }
  };

  const handleCardScanned = async (imageBase64: string, imageUri: string) => {
    if (!claudeService) {
      const service = await initializeClaudeService();
      if (!service) {
        Alert.alert('Error', 'Claude service not initialized');
        return;
      }
      setClaudeService(service);
    }

    setCurrentImageUri(imageUri);
    setIsProcessing(true);

    try {
      const service = claudeService || await initializeClaudeService();
      if (!service) {
        throw new Error('Failed to initialize Claude service');
      }

      const extractedData = await service.extractBusinessCardInfo(imageBase64);

      if (extractedData.length === 0) {
        Alert.alert('No Cards Found', 'No business cards were detected in the image. Please try again.');
        setIsProcessing(false);
        return;
      }

      setExtractedCards(extractedData);

      if (extractedData.length === 1) {
        // Single card, go directly to review
        setCurrentCardData(extractedData[0]);
        setCurrentScreen('review');
      } else {
        // Multiple cards, show selection screen
        setCurrentScreen('selection');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to extract business card information. Please try again.'
      );
      console.error('Error extracting card data:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectCard = (card: BusinessCardData, index: number) => {
    setCurrentCardData(card);
    setCurrentScreen('review');
  };

  const handleSaveContact = async (cardData: BusinessCardData) => {
    try {
      // Always save to app memory first
      await ContactsStorage.saveContact(cardData);

      // Try to save to phone contacts
      try {
        const contact = parseBusinessCardToContact(cardData);
        const phoneContactId = await saveContactToPhone(contact);

        // Update app storage with phone contact ID
        await ContactsStorage.saveContact(cardData, phoneContactId);

        setSavedContact(cardData);
        setCurrentScreen('success');
      } catch (phoneError: any) {
        // Even if phone save fails, we saved to app memory
        console.error('Phone save error:', phoneError);

        // Show warning but still proceed
        Alert.alert(
          'Partially Saved',
          `Contact saved to app history, but couldn't save to phone contacts.\n\n${phoneError.message || 'Unknown error'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSavedContact(cardData);
                setCurrentScreen('success');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save contact.';
      Alert.alert('Error Saving Contact', errorMessage);
      console.error('Error saving contact:', error);
    }
  };

  const handleGenerateMessage = async (context: string): Promise<string> => {
    let service = claudeService;

    if (!service) {
      service = await initializeClaudeService();
      if (!service) {
        throw new Error('Please configure your API key in Settings');
      }
      setClaudeService(service);
    }

    // Load custom message context from settings
    const customContext = await AsyncStorage.getItem(MESSAGE_CONTEXT_KEY);

    const contactName = savedContact.name || 'there';
    return await service.generateWhatsAppMessage(contactName, context, customContext || undefined);
  };

  const handleSendMessage = async (phoneNumber: string, message: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await sendWhatsAppMessage(formattedPhone, message);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to open WhatsApp'
      );
      console.error('Error sending WhatsApp message:', error);
    }
  };

  const handleBackToCamera = () => {
    setCurrentCardData({});
    setCurrentImageUri('');
    setCurrentScreen('camera');
  };

  const handleBackToTabs = () => {
    setCurrentCardData({});
    setCurrentImageUri('');
    setSavedContact({});
    setCurrentScreen('tabs');
  };

  const handleShowMessageScreen = () => {
    setCurrentScreen('message');
  };

  const handleScanAnother = () => {
    setCurrentCardData({});
    setCurrentImageUri('');
    setSavedContact({});
    setCurrentScreen('camera');
  };

  const handleSelectContact = (contact: any) => {
    setSelectedContactId(contact.id);
    setCurrentScreen('contactDetail');
  };

  const handleBackFromContactDetail = () => {
    setSelectedContactId('');
    setCurrentScreen('tabs');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'tabs':
        return (
          <TabNavigator
            onStartScan={handleStartScan}
            onGenerateMessage={handleGenerateMessage}
            onSendMessage={handleSendMessage}
            onSelectContact={handleSelectContact}
          />
        );

      case 'camera':
        return (
          <CameraScreen
            onCardScanned={handleCardScanned}
            onBack={handleBackToTabs}
          />
        );

      case 'selection':
        return (
          <CardSelectionScreen
            imageUri={currentImageUri}
            cards={extractedCards}
            onSelectCard={handleSelectCard}
            onBack={handleBackToCamera}
          />
        );

      case 'review':
        return (
          <ReviewScreen
            imageUri={currentImageUri}
            cardData={currentCardData}
            isLoading={isProcessing}
            onSaveContact={handleSaveContact}
            onBack={extractedCards.length > 1 ? () => setCurrentScreen('selection') : handleBackToCamera}
          />
        );

      case 'success':
        return (
          <SuccessScreen
            contact={savedContact}
            onSendMessage={handleShowMessageScreen}
            onScanAnother={handleScanAnother}
          />
        );

      case 'message':
        return (
          <MessageScreen
            contact={savedContact}
            onGenerateMessage={handleGenerateMessage}
            onSendMessage={handleSendMessage}
            onBack={handleScanAnother}
          />
        );

      case 'contactDetail':
        return (
          <ContactDetailScreen
            contactId={selectedContactId}
            onBack={handleBackFromContactDetail}
            onGenerateMessage={handleGenerateMessage}
            onSendMessage={handleSendMessage}
          />
        );

      default:
        return (
          <TabNavigator
            onStartScan={handleStartScan}
            onGenerateMessage={handleGenerateMessage}
            onSendMessage={handleSendMessage}
            onSelectContact={handleSelectContact}
          />
        );
    }
  };

  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {renderScreen()}
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

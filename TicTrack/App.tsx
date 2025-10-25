import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { CardSelectionScreen } from './src/screens/CardSelectionScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { MessageScreen } from './src/screens/MessageScreen';
import { QuickMessageScreen } from './src/screens/QuickMessageScreen';
import { SuccessScreen } from './src/screens/SuccessScreen';
import { ClaudeService } from './src/services/claudeService';
import {
  parseBusinessCardToContact,
  saveContactToPhone,
} from './src/utils/contactUtils';
import { sendWhatsAppMessage, formatPhoneNumber } from './src/utils/whatsappUtils';
import { BusinessCardData } from './src/types';
import { COLORS } from './src/utils/colors';

type Screen =
  | 'home'
  | 'camera'
  | 'selection'
  | 'review'
  | 'success'
  | 'message'
  | 'quickMessage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [claudeService, setClaudeService] = useState<ClaudeService | null>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [extractedCards, setExtractedCards] = useState<BusinessCardData[]>([]);
  const [currentCardData, setCurrentCardData] = useState<BusinessCardData>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedContact, setSavedContact] = useState<BusinessCardData>({});

  const handleStartScan = (apiKey: string) => {
    const service = new ClaudeService(apiKey);
    setClaudeService(service);
    setCurrentScreen('camera');
  };

  const handleStartQuickMessage = (apiKey: string) => {
    const service = new ClaudeService(apiKey);
    setClaudeService(service);
    setCurrentScreen('quickMessage');
  };

  const handleCardScanned = async (imageBase64: string, imageUri: string) => {
    if (!claudeService) {
      Alert.alert('Error', 'Claude service not initialized');
      return;
    }

    setCurrentImageUri(imageUri);
    setIsProcessing(true);

    try {
      const extractedData = await claudeService.extractBusinessCardInfo(imageBase64);

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
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to extract business card information. Please try again.'
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
      const contact = parseBusinessCardToContact(cardData);
      await saveContactToPhone(contact);
      setSavedContact(cardData);
      setCurrentScreen('success');
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save contact. Please check permissions and try again.'
      );
      console.error('Error saving contact:', error);
    }
  };

  const handleGenerateMessage = async (context: string): Promise<string> => {
    if (!claudeService) {
      throw new Error('Claude service not initialized');
    }

    const contactName = savedContact.name || 'there';
    return await claudeService.generateWhatsAppMessage(contactName, context);
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

  const handleBackToHome = () => {
    setCurrentCardData({});
    setCurrentImageUri('');
    setSavedContact({});
    setCurrentScreen('home');
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

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onStartScan={handleStartScan} onStartQuickMessage={handleStartQuickMessage} />;

      case 'camera':
        return (
          <CameraScreen
            onCardScanned={handleCardScanned}
            onBack={handleBackToHome}
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

      case 'quickMessage':
        return (
          <QuickMessageScreen
            onGenerateMessage={handleGenerateMessage}
            onSendMessage={handleSendMessage}
            onBack={handleBackToHome}
          />
        );

      default:
        return <HomeScreen onStartScan={handleStartScan} onStartQuickMessage={handleStartQuickMessage} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

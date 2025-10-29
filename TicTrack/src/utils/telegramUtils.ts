import * as Linking from 'expo-linking';
import { BusinessCardData } from '../types';

export const sendTelegramMessage = async (
  phoneNumber: string,
  message: string
): Promise<void> => {
  // Clean phone number but preserve + if at start
  let cleanNumber = phoneNumber.trim();

  // Remove all non-numeric characters except + at the beginning
  if (cleanNumber.startsWith('+')) {
    cleanNumber = '+' + cleanNumber.substring(1).replace(/\D/g, '');
  } else {
    cleanNumber = cleanNumber.replace(/\D/g, '');
  }

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);

  // Create Telegram URL
  const telegramUrl = `tg://msg?text=${encodedMessage}&to=${cleanNumber}`;

  // Check if Telegram is installed
  const canOpen = await Linking.canOpenURL(telegramUrl);

  if (canOpen) {
    await Linking.openURL(telegramUrl);
  } else {
    throw new Error('Telegram is not installed on this device');
  }
};

export const sendContactToTictagBot = async (
  contact: BusinessCardData
): Promise<void> => {
  // Format contact details as message
  const contactDetails = formatContactForBot(contact);

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(contactDetails);

  // Create Telegram bot URL - opens chat with @Ttnamecard_bot
  const telegramBotUrl = `tg://resolve?domain=Ttnamecard_bot&text=${encodedMessage}`;

  // Check if Telegram is installed
  const canOpen = await Linking.canOpenURL(telegramBotUrl);

  if (canOpen) {
    await Linking.openURL(telegramBotUrl);
  } else {
    throw new Error('Telegram is not installed on this device');
  }
};

const formatContactForBot = (contact: BusinessCardData): string => {
  const lines: string[] = [];

  if (contact.name) lines.push(`👤 Name: ${contact.name}`);
  if (contact.company) lines.push(`🏢 Company: ${contact.company}`);
  if (contact.title) lines.push(`💼 Title: ${contact.title}`);
  if (contact.email) lines.push(`📧 Email: ${contact.email}`);
  if (contact.phone) lines.push(`📱 Phone: ${contact.phone}`);
  if (contact.mobile) lines.push(`📱 Mobile: ${contact.mobile}`);
  if (contact.website) lines.push(`🌐 Website: ${contact.website}`);
  if (contact.address) lines.push(`📍 Address: ${contact.address}`);
  if (contact.linkedin) lines.push(`💼 LinkedIn: ${contact.linkedin}`);
  if (contact.twitter) lines.push(`🐦 Twitter: ${contact.twitter}`);

  return lines.join('\n');
};

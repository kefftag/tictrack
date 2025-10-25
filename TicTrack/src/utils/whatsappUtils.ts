import * as Linking from 'expo-linking';

export const sendWhatsAppMessage = async (
  phoneNumber: string,
  message: string
): Promise<void> => {
  // Remove all non-numeric characters from phone number
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);

  // Create WhatsApp URL
  const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;

  // Check if WhatsApp is installed
  const canOpen = await Linking.canOpenURL(whatsappUrl);

  if (canOpen) {
    await Linking.openURL(whatsappUrl);
  } else {
    throw new Error('WhatsApp is not installed on this device');
  }
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // If it doesn't start with country code, you might want to add one
  // This is a simple implementation - you might want to make it more sophisticated
  if (cleaned.length === 10) {
    // Assuming US number format
    return `+1${cleaned}`;
  }

  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }

  return cleaned;
};

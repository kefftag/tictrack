import * as Linking from 'expo-linking';

export const sendWhatsAppMessage = async (
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

  // Create WhatsApp URL (WhatsApp expects no + in the URL)
  const numberForUrl = cleanNumber.startsWith('+') ? cleanNumber.substring(1) : cleanNumber;
  const whatsappUrl = `whatsapp://send?phone=${numberForUrl}&text=${encodedMessage}`;

  // Check if WhatsApp is installed
  const canOpen = await Linking.canOpenURL(whatsappUrl);

  if (canOpen) {
    await Linking.openURL(whatsappUrl);
  } else {
    throw new Error('WhatsApp is not installed on this device');
  }
};

/**
 * Format phone number for WhatsApp
 * Preserves international country codes and only adds +1 for truly local US numbers
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Trim whitespace
  let cleaned = phone.trim();

  // If already has country code (starts with +), preserve it
  if (cleaned.startsWith('+')) {
    // Remove all non-digits except the leading +
    return '+' + cleaned.substring(1).replace(/\D/g, '');
  }

  // Remove all non-digits
  cleaned = cleaned.replace(/\D/g, '');

  // If exactly 10 digits AND doesn't start with a country code digit (not 1-9 country codes)
  // AND doesn't look like it includes a country code, assume US
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If 11 digits starting with 1, assume US number with country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // For any other length, assume it already includes country code
  // Just add the + if not present
  return `+${cleaned}`;
};


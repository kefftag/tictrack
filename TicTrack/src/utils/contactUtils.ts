import * as Contacts from 'expo-contacts';
import { BusinessCardData, Contact } from '../types';

/**
 * Format phone number to include country code if not present
 * Preserves international country codes and only defaults to +1 for US numbers
 * Examples:
 *   "+65 9793 9073" -> "+6597939073"
 *   "555-1234" -> "+15551234" (if 10 digits)
 *   "+44 20 1234 5678" -> "+442012345678"
 */
export const formatPhoneNumberWithCountryCode = (phone: string | undefined, defaultCountryCode: string = '+1'): string => {
  if (!phone) return '';

  let cleaned = phone.trim();

  // If already has country code (starts with +), clean and preserve it
  if (cleaned.startsWith('+')) {
    // Remove all non-digits except the leading +
    return '+' + cleaned.substring(1).replace(/\D/g, '');
  }

  // Remove all non-digits
  cleaned = cleaned.replace(/\D/g, '');

  // If starts with 1 and has 11 digits (US format with country code), add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }

  // If exactly 10 digits (US local number), add default country code
  if (cleaned.length === 10) {
    return defaultCountryCode + cleaned;
  }

  // For any other length, assume it already includes country code
  // (e.g., Singapore: 6597939073 is 10 digits but starts with 65 country code)
  // Just add + sign
  if (cleaned.length > 10) {
    return '+' + cleaned;
  }

  // If less than 10 digits, add default country code
  return defaultCountryCode + cleaned;
};

export const parseBusinessCardToContact = (
  cardData: BusinessCardData
): Contact => {
  const nameParts = cardData.name?.split(' ') || ['', ''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const contact: Contact = {
    firstName,
    lastName,
    company: cardData.company,
    jobTitle: cardData.title,
  };

  if (cardData.email) {
    contact.emails = [{ email: cardData.email, label: 'work' }];
  }

  const phoneNumbers: Array<{ number: string; label: string }> = [];
  if (cardData.phone) {
    const formattedPhone = formatPhoneNumberWithCountryCode(cardData.phone);
    phoneNumbers.push({ number: formattedPhone, label: 'work' });
  }
  if (cardData.mobile) {
    const formattedMobile = formatPhoneNumberWithCountryCode(cardData.mobile);
    phoneNumbers.push({ number: formattedMobile, label: 'mobile' });
  }
  if (phoneNumbers.length > 0) {
    contact.phoneNumbers = phoneNumbers;
  }

  if (cardData.website) {
    contact.urlAddresses = [{ url: cardData.website, label: 'work' }];
  }

  if (cardData.address) {
    contact.addresses = [
      {
        street: cardData.address,
        label: 'work',
      },
    ];
  }

  return contact;
};

export const saveContactToPhone = async (
  contact: Contact
): Promise<string> => {
  try {
    console.log('Requesting contacts permission...');
    const { status } = await Contacts.requestPermissionsAsync();

    console.log('Contacts permission status:', status);

    if (status !== 'granted') {
      throw new Error('Contacts permission denied. Please enable contacts access in your device settings:\n\nSettings > Apps > TicTrack > Permissions > Contacts');
    }

    // Get available containers (to handle cloud/local account detection)
    let containerId: string | undefined;
    try {
      const containers = await Contacts.getDefaultContainerIdAsync();
      containerId = containers;
      console.log('Using default container:', containerId);
    } catch (containerError) {
      console.log('Could not get default container, will use system default');
      // Let the system choose the default container
    }

    const contactData: Contacts.Contact = {
      [Contacts.Fields.FirstName]: contact.firstName,
      [Contacts.Fields.LastName]: contact.lastName,
      [Contacts.Fields.Company]: contact.company || '',
      [Contacts.Fields.JobTitle]: contact.jobTitle || '',
    };

    if (contact.emails && contact.emails.length > 0) {
      contactData[Contacts.Fields.Emails] = contact.emails.map((e) => ({
        email: e.email,
        label: e.label,
      }));
    }

    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      contactData[Contacts.Fields.PhoneNumbers] = contact.phoneNumbers.map(
        (p) => ({
          number: p.number,
          label: p.label,
        })
      );
    }

    if (contact.urlAddresses && contact.urlAddresses.length > 0) {
      contactData[Contacts.Fields.UrlAddresses] = contact.urlAddresses.map(
        (u) => ({
          url: u.url,
          label: u.label,
        })
      );
    }

    if (contact.addresses && contact.addresses.length > 0) {
      contactData[Contacts.Fields.Addresses] = contact.addresses.map((a) => ({
        street: a.street || '',
        city: a.city || '',
        region: a.region || '',
        postalCode: a.postalCode || '',
        country: a.country || '',
        label: a.label,
      }));
    }

    console.log('Saving contact to phone...', contactData);

    // Save contact with container ID if available (for cloud account support)
    let contactId: string;
    if (containerId) {
      contactId = await Contacts.addContactAsync(contactData, containerId);
    } else {
      // Let system choose default container
      contactId = await Contacts.addContactAsync(contactData);
    }

    console.log('Contact saved successfully with ID:', contactId);

    return contactId;
  } catch (error: any) {
    console.error('Error saving contact to phone:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Handle cloud account specific errors
    if (error.message?.includes('cloud') || error.message?.includes('SIM')) {
      throw new Error(
        'Cannot save to this account type. Your device is set to use a cloud account (like Google Contacts). The contact has been saved to app history, but could not be added to your phone contacts.\n\nTo fix: Go to Settings > Accounts and ensure your default contacts account supports adding new contacts.'
      );
    }

    // Provide specific error messages
    if (error.message?.includes('permission')) {
      throw error; // Already has good message
    } else if (error.message?.includes('denied')) {
      throw new Error('Contact save denied. Please grant contacts permission in Settings.');
    } else if (error.message?.includes('not available')) {
      throw new Error('Contacts feature not available on this device.');
    } else {
      throw new Error(`Failed to save contact to phone: ${error.message || 'Unknown error'}. Contact has been saved to app history.`);
    }
  }
};

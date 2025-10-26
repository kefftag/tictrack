import * as Contacts from 'expo-contacts';
import { BusinessCardData, Contact } from '../types';

/**
 * Format phone number to include country code if not present
 * Assumes US (+1) if no country code is detected
 */
export const formatPhoneNumberWithCountryCode = (phone: string | undefined, defaultCountryCode: string = '+1'): string => {
  if (!phone) return '';

  // Remove all non-digit characters except + at start
  let cleaned = phone.trim();

  // If already has country code (starts with +), return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove all non-digits
  cleaned = cleaned.replace(/\D/g, '');

  // If starts with 1 and has 11 digits (US format), add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }

  // If 10 digits (US local), add country code
  if (cleaned.length === 10) {
    return defaultCountryCode + cleaned;
  }

  // Otherwise, add default country code
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
    const contactId = await Contacts.addContactAsync(contactData);
    console.log('Contact saved successfully with ID:', contactId);

    return contactId;
  } catch (error: any) {
    console.error('Error saving contact to phone:', error);

    // Provide specific error messages
    if (error.message?.includes('permission')) {
      throw error; // Already has good message
    } else if (error.message?.includes('denied')) {
      throw new Error('Contact save denied. Please grant contacts permission in Settings.');
    } else if (error.message?.includes('not available')) {
      throw new Error('Contacts feature not available on this device.');
    } else {
      throw new Error(`Failed to save contact: ${error.message || 'Unknown error'}`);
    }
  }
};

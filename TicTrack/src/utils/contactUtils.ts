import * as Contacts from 'expo-contacts';
import { BusinessCardData, Contact } from '../types';

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
    phoneNumbers.push({ number: cardData.phone, label: 'work' });
  }
  if (cardData.mobile) {
    phoneNumbers.push({ number: cardData.mobile, label: 'mobile' });
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
  const { status } = await Contacts.requestPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Contacts permission not granted');
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

  const contactId = await Contacts.addContactAsync(contactData);
  return contactId;
};

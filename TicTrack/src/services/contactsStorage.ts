import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessCardData } from '../types';

const CONTACTS_STORAGE_KEY = '@tictrack_saved_contacts';

export interface MessageHistory {
  id: string;
  message: string;
  context: string;
  generatedAt: string; // ISO date string
  sentViaWhatsApp: boolean;
}

export interface SavedContact extends BusinessCardData {
  id: string;
  savedAt: string; // ISO date string
  phoneContactId?: string; // ID from phone contacts if saved there
  messages?: MessageHistory[]; // History of generated messages
  notes?: string; // User notes about this contact
  event?: string; // Event where contact was met
}

export class ContactsStorage {
  /**
   * Save a contact to app memory
   */
  static async saveContact(contact: BusinessCardData, phoneContactId?: string, event?: string): Promise<SavedContact> {
    try {
      const savedContact: SavedContact = {
        ...contact,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        savedAt: new Date().toISOString(),
        phoneContactId,
        event,
      };

      const existingContacts = await this.getAllContacts();
      const updatedContacts = [savedContact, ...existingContacts];

      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
      console.log('Contact saved to app memory:', savedContact.id);

      return savedContact;
    } catch (error) {
      console.error('Error saving contact to app memory:', error);
      throw new Error('Failed to save contact to app memory');
    }
  }

  /**
   * Get all saved contacts
   */
  static async getAllContacts(): Promise<SavedContact[]> {
    try {
      const contactsJson = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (!contactsJson) {
        return [];
      }

      const contacts = JSON.parse(contactsJson);
      return Array.isArray(contacts) ? contacts : [];
    } catch (error) {
      console.error('Error loading contacts from app memory:', error);
      return [];
    }
  }

  /**
   * Get contacts sorted by date (newest first)
   */
  static async getContactsSortedByDate(): Promise<SavedContact[]> {
    const contacts = await this.getAllContacts();
    return contacts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  /**
   * Get contacts sorted by name
   */
  static async getContactsSortedByName(): Promise<SavedContact[]> {
    const contacts = await this.getAllContacts();
    return contacts.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Get contacts sorted by event
   */
  static async getContactsSortedByEvent(): Promise<SavedContact[]> {
    const contacts = await this.getAllContacts();
    return contacts.sort((a, b) => {
      const eventA = a.event?.toLowerCase() || 'zzz'; // Put contacts without events at the end
      const eventB = b.event?.toLowerCase() || 'zzz';
      return eventA.localeCompare(eventB);
    });
  }

  /**
   * Get contacts filtered by event
   */
  static async getContactsByEvent(event: string): Promise<SavedContact[]> {
    const contacts = await this.getAllContacts();
    if (!event.trim()) {
      return contacts;
    }
    return contacts.filter(c => c.event?.toLowerCase() === event.toLowerCase());
  }

  /**
   * Get all unique events
   */
  static async getAllEvents(): Promise<string[]> {
    const contacts = await this.getAllContacts();
    const events = new Set<string>();
    contacts.forEach(contact => {
      if (contact.event && contact.event.trim()) {
        events.add(contact.event);
      }
    });
    return Array.from(events).sort();
  }

  /**
   * Delete a contact by ID
   */
  static async deleteContact(id: string): Promise<void> {
    try {
      const contacts = await this.getAllContacts();
      const updatedContacts = contacts.filter(c => c.id !== id);
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
      console.log('Contact deleted from app memory:', id);
    } catch (error) {
      console.error('Error deleting contact from app memory:', error);
      throw new Error('Failed to delete contact');
    }
  }

  /**
   * Clear all saved contacts
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONTACTS_STORAGE_KEY);
      console.log('All contacts cleared from app memory');
    } catch (error) {
      console.error('Error clearing contacts from app memory:', error);
      throw new Error('Failed to clear contacts');
    }
  }

  /**
   * Get contact by ID
   */
  static async getContactById(id: string): Promise<SavedContact | null> {
    const contacts = await this.getAllContacts();
    return contacts.find(c => c.id === id) || null;
  }

  /**
   * Add a message to a contact's history
   */
  static async addMessageToContact(
    contactId: string,
    message: string,
    context: string,
    sentViaWhatsApp: boolean = false
  ): Promise<void> {
    try {
      const contacts = await this.getAllContacts();
      const contactIndex = contacts.findIndex(c => c.id === contactId);

      if (contactIndex === -1) {
        throw new Error('Contact not found');
      }

      const messageHistory: MessageHistory = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        message,
        context,
        generatedAt: new Date().toISOString(),
        sentViaWhatsApp,
      };

      if (!contacts[contactIndex].messages) {
        contacts[contactIndex].messages = [];
      }

      contacts[contactIndex].messages!.unshift(messageHistory);

      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
      console.log('Message added to contact:', contactId);
    } catch (error) {
      console.error('Error adding message to contact:', error);
      throw new Error('Failed to add message to contact');
    }
  }

  /**
   * Search contacts by name or company
   */
  static async searchContacts(query: string): Promise<SavedContact[]> {
    const contacts = await this.getAllContacts();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return contacts;
    }

    return contacts.filter(contact => {
      const name = contact.name?.toLowerCase() || '';
      const company = contact.company?.toLowerCase() || '';
      return name.includes(lowerQuery) || company.includes(lowerQuery);
    });
  }

  /**
   * Update a contact
   */
  static async updateContact(contactId: string, updates: Partial<BusinessCardData>): Promise<void> {
    try {
      const contacts = await this.getAllContacts();
      const contactIndex = contacts.findIndex(c => c.id === contactId);

      if (contactIndex === -1) {
        throw new Error('Contact not found');
      }

      contacts[contactIndex] = {
        ...contacts[contactIndex],
        ...updates,
      };

      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
      console.log('Contact updated:', contactId);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw new Error('Failed to update contact');
    }
  }
}

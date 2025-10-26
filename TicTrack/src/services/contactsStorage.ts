import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessCardData } from '../types';

const CONTACTS_STORAGE_KEY = '@tictrack_saved_contacts';

export interface SavedContact extends BusinessCardData {
  id: string;
  savedAt: string; // ISO date string
  phoneContactId?: string; // ID from phone contacts if saved there
}

export class ContactsStorage {
  /**
   * Save a contact to app memory
   */
  static async saveContact(contact: BusinessCardData, phoneContactId?: string): Promise<SavedContact> {
    try {
      const savedContact: SavedContact = {
        ...contact,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        savedAt: new Date().toISOString(),
        phoneContactId,
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
}

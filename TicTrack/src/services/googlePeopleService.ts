import { GoogleAuthService } from './googleAuthService';
import { BusinessCardData } from '../types';

const PEOPLE_API_BASE_URL = 'https://people.googleapis.com/v1';

export interface GoogleContactResponse {
  resourceName: string;
  etag: string;
  names?: Array<{
    displayName?: string;
    familyName?: string;
    givenName?: string;
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
  }>;
}

export class GooglePeopleService {
  private authService: GoogleAuthService;

  constructor() {
    this.authService = GoogleAuthService.getInstance();
  }

  /**
   * Create a contact in Google Contacts
   */
  async createContact(contactData: BusinessCardData): Promise<{
    success: boolean;
    resourceName?: string;
    error?: string;
  }> {
    try {
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: 'Not authenticated with Google',
        };
      }

      // Build the contact payload according to Google People API format
      const payload = this.buildContactPayload(contactData);

      console.log('Creating Google contact with payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${PEOPLE_API_BASE_URL}/people:createContact`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Google People API error:', errorData);

        // Check for token expiration
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authentication expired. Please sign in again.',
          };
        }

        return {
          success: false,
          error: errorData.error?.message || `Failed to create contact: ${response.statusText}`,
        };
      }

      const result: GoogleContactResponse = await response.json();
      console.log('Google contact created:', result.resourceName);

      return {
        success: true,
        resourceName: result.resourceName,
      };
    } catch (error: any) {
      console.error('Error creating Google contact:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Build contact payload for Google People API
   */
  private buildContactPayload(contactData: BusinessCardData): any {
    const payload: any = {};

    // Names
    if (contactData.name) {
      const nameParts = this.parseFullName(contactData.name);
      payload.names = [
        {
          givenName: nameParts.firstName,
          familyName: nameParts.lastName,
          displayName: contactData.name,
        },
      ];
    }

    // Organization and title
    if (contactData.company || contactData.title) {
      payload.organizations = [
        {
          name: contactData.company || '',
          title: contactData.title || '',
          type: 'work',
        },
      ];
    }

    // Email addresses
    const emailAddresses: Array<{ value: string; type: string }> = [];
    if (contactData.email) {
      emailAddresses.push({
        value: contactData.email,
        type: 'work',
      });
    }
    if (contactData.emails && contactData.emails.length > 0) {
      contactData.emails.forEach((e) => {
        if (e.email && !emailAddresses.find(ea => ea.value === e.email)) {
          emailAddresses.push({
            value: e.email,
            type: e.label || 'other',
          });
        }
      });
    }
    if (emailAddresses.length > 0) {
      payload.emailAddresses = emailAddresses;
    }

    // Phone numbers
    const phoneNumbers: Array<{ value: string; type: string }> = [];
    if (contactData.phone) {
      phoneNumbers.push({
        value: contactData.phone,
        type: 'work',
      });
    }
    if (contactData.mobile) {
      phoneNumbers.push({
        value: contactData.mobile,
        type: 'mobile',
      });
    }
    if (contactData.phoneNumbers && contactData.phoneNumbers.length > 0) {
      contactData.phoneNumbers.forEach((p) => {
        if (p.number && !phoneNumbers.find(pn => pn.value === p.number)) {
          phoneNumbers.push({
            value: p.number,
            type: p.label || 'other',
          });
        }
      });
    }
    if (phoneNumbers.length > 0) {
      payload.phoneNumbers = phoneNumbers;
    }

    // Addresses
    if (contactData.address) {
      payload.addresses = [
        {
          formattedValue: contactData.address,
          type: 'work',
        },
      ];
    }

    // Websites/URLs
    const urls: Array<{ value: string; type: string }> = [];
    if (contactData.website) {
      urls.push({
        value: contactData.website,
        type: 'work',
      });
    }
    if (contactData.linkedin) {
      urls.push({
        value: contactData.linkedin,
        type: 'profile',
      });
    }
    if (contactData.twitter) {
      const twitterUrl = contactData.twitter.startsWith('http')
        ? contactData.twitter
        : `https://twitter.com/${contactData.twitter.replace('@', '')}`;
      urls.push({
        value: twitterUrl,
        type: 'profile',
      });
    }
    if (urls.length > 0) {
      payload.urls = urls;
    }

    return payload;
  }

  /**
   * Parse full name into first and last name
   */
  private parseFullName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 0) {
      return { firstName: '', lastName: '' };
    }

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    // Assume first part is first name, rest is last name
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    return { firstName, lastName };
  }

  /**
   * Get a contact by resource name
   */
  async getContact(resourceName: string): Promise<GoogleContactResponse | null> {
    try {
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${PEOPLE_API_BASE_URL}/${resourceName}?personFields=names,emailAddresses,phoneNumbers,organizations,addresses,urls`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get contact: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Google contact:', error);
      return null;
    }
  }

  /**
   * Update a contact
   */
  async updateContact(
    resourceName: string,
    contactData: BusinessCardData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: 'Not authenticated with Google',
        };
      }

      // First, get the current contact to get the etag
      const currentContact = await this.getContact(resourceName);
      if (!currentContact) {
        return {
          success: false,
          error: 'Contact not found',
        };
      }

      const payload = this.buildContactPayload(contactData);

      const response = await fetch(
        `${PEOPLE_API_BASE_URL}/${resourceName}:updateContact?updatePersonFields=names,emailAddresses,phoneNumbers,organizations,addresses,urls`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Google People API error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || `Failed to update contact: ${response.statusText}`,
        };
      }

      console.log('Google contact updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating Google contact:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(resourceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.authService.getAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: 'Not authenticated with Google',
        };
      }

      const response = await fetch(
        `${PEOPLE_API_BASE_URL}/${resourceName}:deleteContact`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `Failed to delete contact: ${response.statusText}`,
        };
      }

      console.log('Google contact deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting Google contact:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }
}

export interface BusinessCardData {
  name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  linkedin?: string;
  twitter?: string;
  rawText?: string;
}

export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  emails?: Array<{
    email: string;
    label: string;
  }>;
  phoneNumbers?: Array<{
    number: string;
    label: string;
  }>;
  urlAddresses?: Array<{
    url: string;
    label: string;
  }>;
  addresses?: Array<{
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    label: string;
  }>;
}

export interface WhatsAppMessage {
  contactName: string;
  message: string;
  phoneNumber: string;
}

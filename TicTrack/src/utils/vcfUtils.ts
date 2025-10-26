import { BusinessCardData } from '../types';
import { SavedContact } from '../services/contactsStorage';

/**
 * Generate VCF (vCard) content from business card data
 */
export const generateVCF = (contact: BusinessCardData | SavedContact): string => {
  const lines: string[] = [];

  // Start vCard
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');

  // Name
  if (contact.name) {
    // Split name into parts (FN = Full Name, N = Name components)
    const nameParts = contact.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    lines.push(`FN:${contact.name}`);
    lines.push(`N:${lastName};${firstName};;;`);
  }

  // Organization and Title
  if (contact.company || contact.title) {
    lines.push(`ORG:${contact.company || ''}`);
    if (contact.title) {
      lines.push(`TITLE:${contact.title}`);
    }
  }

  // Email addresses
  if (contact.email) {
    lines.push(`EMAIL;TYPE=WORK:${contact.email}`);
  }
  if (contact.emails && contact.emails.length > 0) {
    contact.emails.forEach((e) => {
      if (e.email && e.email !== contact.email) {
        const type = e.label?.toUpperCase() || 'OTHER';
        lines.push(`EMAIL;TYPE=${type}:${e.email}`);
      }
    });
  }

  // Phone numbers
  if (contact.phone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${contact.phone}`);
  }
  if (contact.mobile) {
    lines.push(`TEL;TYPE=CELL,VOICE:${contact.mobile}`);
  }
  if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
    contact.phoneNumbers.forEach((p) => {
      if (p.number && p.number !== contact.phone && p.number !== contact.mobile) {
        const type = p.label?.toUpperCase() || 'OTHER';
        lines.push(`TEL;TYPE=${type},VOICE:${p.number}`);
      }
    });
  }

  // Address
  if (contact.address) {
    // Format: ADR;TYPE=WORK:;;street;city;state;zip;country
    // We only have full address, so put it in street field
    lines.push(`ADR;TYPE=WORK:;;${contact.address};;;;`);
  }

  // Website/URL
  if (contact.website) {
    lines.push(`URL;TYPE=WORK:${contact.website}`);
  }

  // LinkedIn
  if (contact.linkedin) {
    lines.push(`URL;TYPE=LINKEDIN:${contact.linkedin}`);
  }

  // Twitter
  if (contact.twitter) {
    const twitterUrl = contact.twitter.startsWith('http')
      ? contact.twitter
      : `https://twitter.com/${contact.twitter.replace('@', '')}`;
    lines.push(`URL;TYPE=TWITTER:${twitterUrl}`);
  }

  // Note - Add app attribution
  lines.push(`NOTE:Created with TicTrack Business Card Scanner`);

  // Add saved date if available
  if ('savedAt' in contact && contact.savedAt) {
    const date = new Date(contact.savedAt);
    const timestamp = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    lines.push(`REV:${timestamp}`);
  }

  // End vCard
  lines.push('END:VCARD');

  return lines.join('\r\n');
};

/**
 * Generate filename for VCF file
 */
export const generateVCFFilename = (contact: BusinessCardData | SavedContact): string => {
  const name = contact.name || 'contact';
  // Remove special characters and spaces
  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  return `${safeName}_${timestamp}.vcf`;
};

/**
 * Validate VCF content
 */
export const validateVCF = (vcfContent: string): boolean => {
  return (
    vcfContent.includes('BEGIN:VCARD') &&
    vcfContent.includes('END:VCARD') &&
    vcfContent.includes('VERSION:')
  );
};

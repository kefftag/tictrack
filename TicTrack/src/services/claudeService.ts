import Anthropic from '@anthropic-ai/sdk';
import { BusinessCardData } from '../types';

export class ClaudeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async extractBusinessCardInfo(imageBase64: string): Promise<BusinessCardData[]> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `Please analyze this image and extract information from ALL business cards visible in the image.

If there are multiple business cards, return a JSON array with one object per card.
If there is only one business card, return a JSON array with a single object.

Each object should have the following fields (only include fields that are present on the card):
- name (full name)
- company (company name)
- title (job title/position)
- email
- phone (office phone)
- mobile (mobile phone)
- website
- address (full address)
- linkedin (LinkedIn profile URL)
- twitter (Twitter handle)

Return ONLY the JSON array, no additional text or explanation.
Example format: [{"name": "John Doe", "company": "ABC Corp", ...}, {"name": "Jane Smith", ...}]`,
              },
            ],
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        // Try to find JSON array first
        const arrayMatch = content.text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const parsed = JSON.parse(arrayMatch[0]);
          return Array.isArray(parsed) ? parsed : [parsed];
        }

        // Fallback to single object
        const objectMatch = content.text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          return [JSON.parse(objectMatch[0]) as BusinessCardData];
        }
      }

      throw new Error('Failed to extract business card data');
    } catch (error) {
      console.error('Error extracting business card info:', error);
      throw error;
    }
  }

  async generateWhatsAppMessage(
    contactName: string,
    context: string
  ): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Generate a friendly, professional WhatsApp follow-up message for ${contactName}.

Context: ${context}

The message should be:
- Warm and personable
- Professional but not overly formal
- Brief (2-3 sentences)
- Include a clear call to action or next step

Return ONLY the message text, no quotes or additional formatting.`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      throw new Error('Failed to generate WhatsApp message');
    } catch (error) {
      console.error('Error generating WhatsApp message:', error);
      throw error;
    }
  }
}

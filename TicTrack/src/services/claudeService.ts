import Anthropic from '@anthropic-ai/sdk';
import { BusinessCardData } from '../types';

export class ClaudeService {
  private client: Anthropic;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Required for React Native
    });
  }

  /**
   * Test connection to Claude API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing Claude API connection...');
      console.log('API Key:', this.apiKey.substring(0, 10) + '...');

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Reply with just "OK" if you can read this.',
          },
        ],
      });

      console.log('Claude API response:', message);

      const content = message.content[0];
      if (content.type === 'text' && content.text) {
        console.log('✅ Connection successful!');
        return { success: true };
      }

      throw new Error('Invalid response from Claude API');
    } catch (error: any) {
      console.error('❌ Claude API connection failed:', error);

      let errorMessage = 'Unknown error';

      if (error?.status === 401) {
        errorMessage = 'Invalid API key. Please check your API key and try again.';
      } else if (error?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error?.status === 500) {
        errorMessage = 'Claude API server error. Please try again later.';
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async extractBusinessCardInfo(imageBase64: string): Promise<BusinessCardData[]> {
    try {
      console.log('Extracting business card info...');
      console.log('Base64 length:', imageBase64.length);
      console.log('Base64 preview:', imageBase64.substring(0, 50) + '...');

      // Detect image format from base64 header
      let mediaType = 'image/jpeg';
      if (imageBase64.startsWith('/9j/')) {
        mediaType = 'image/jpeg';
      } else if (imageBase64.startsWith('iVBOR')) {
        mediaType = 'image/png';
      } else if (imageBase64.startsWith('R0lGOD')) {
        mediaType = 'image/gif';
      } else if (imageBase64.startsWith('UklG')) {
        mediaType = 'image/webp';
      }

      console.log('Detected media type:', mediaType);

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
                  media_type: mediaType,
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

      console.log('Claude API response:', JSON.stringify(message, null, 2));

      const content = message.content[0];
      if (content.type === 'text') {
        console.log('Claude response text:', content.text);

        // Try to find JSON array first
        const arrayMatch = content.text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const parsed = JSON.parse(arrayMatch[0]);
          console.log('Parsed data:', parsed);
          return Array.isArray(parsed) ? parsed : [parsed];
        }

        // Fallback to single object
        const objectMatch = content.text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          const parsed = JSON.parse(objectMatch[0]) as BusinessCardData;
          console.log('Parsed single object:', parsed);
          return [parsed];
        }

        console.error('Could not find JSON in response:', content.text);
      }

      throw new Error('Failed to extract business card data from response');
    } catch (error: any) {
      console.error('Error extracting business card info:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Provide more specific error messages
      if (error?.status === 401) {
        throw new Error('Invalid API key. Please check your Claude API key.');
      } else if (error?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      } else if (error?.status === 400) {
        throw new Error('Invalid request. The image format might not be supported.');
      } else if (error?.message?.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      }

      throw error;
    }
  }

  async generateWhatsAppMessage(
    contactName: string,
    context: string
  ): Promise<string> {
    try {
      console.log('Generating WhatsApp message...');
      console.log('Contact:', contactName);
      console.log('Context:', context);

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

      console.log('Claude API response:', JSON.stringify(message, null, 2));

      const content = message.content[0];
      if (content.type === 'text') {
        console.log('Generated message:', content.text);
        return content.text.trim();
      }

      throw new Error('Failed to generate WhatsApp message');
    } catch (error: any) {
      console.error('Error generating WhatsApp message:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Provide more specific error messages
      if (error?.status === 401) {
        throw new Error('Invalid API key. Please check your Claude API key.');
      } else if (error?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      } else if (error?.message?.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      }

      throw error;
    }
  }
}

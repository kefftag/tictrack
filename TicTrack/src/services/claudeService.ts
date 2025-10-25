import Anthropic from '@anthropic-ai/sdk';
import { BusinessCardData } from '../types';

export class ClaudeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async extractBusinessCardInfo(imageBase64: string): Promise<BusinessCardData> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
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
                text: `Please extract all information from this business card and return it as a JSON object with the following fields (only include fields that are present on the card):
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

                Return ONLY the JSON object, no additional text or explanation.`,
              },
            ],
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as BusinessCardData;
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

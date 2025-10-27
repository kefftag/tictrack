import * as MailComposer from 'expo-mail-composer';

/**
 * Send email using device's mail client
 */
export const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  isHTML?: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if mail is available
    const isAvailable = await MailComposer.isAvailableAsync();

    if (!isAvailable) {
      return {
        success: false,
        error: 'Email is not available on this device. Please install an email app.',
      };
    }

    // Explicitly convert to boolean to prevent "String cannot be cast to Boolean" error in Expo Go
    // This ensures the value is always a true boolean, never a string "true" or "false"
    const isHtmlBoolean: boolean = isHTML === true;

    // Compose email
    await MailComposer.composeAsync({
      recipients: [to],
      subject: subject,
      body: body,
      isHtml: isHtmlBoolean,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to open email client',
    };
  }
};

/**
 * Format plain text message as HTML email with inline styles only
 */
export const formatAsHTML = (
  message: string,
  contactName: string
): string => {
  // Split message into paragraphs
  const paragraphs = message.split('\n\n').filter(p => p.trim());

  // Use inline styles only - no <style> tags to avoid CSS rendering issues
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px;">
    <div style="font-size: 16px; margin-bottom: 20px;">
      <strong>Hi ${escapeHTML(contactName)},</strong>
    </div>
    <div style="font-size: 15px; margin-bottom: 20px;">
      ${paragraphs.map(p => `<p style="margin: 0 0 15px 0;">${escapeHTML(p)}</p>`).join('')}
    </div>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 13px;">
      <p style="margin: 0;">Best regards</p>
    </div>
  </div>
</body>
</html>`;

  return htmlBody;
};

/**
 * Escape HTML special characters
 */
const escapeHTML = (text: string): string => {
  // React Native doesn't have DOM, so manually escape
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Generate email subject line
 */
export const generateEmailSubject = (contactName: string, context?: string): string => {
  if (context && context.trim()) {
    // Try to extract key topic from context
    const contextLower = context.toLowerCase();

    if (contextLower.includes('follow up') || contextLower.includes('following up')) {
      return `Following up - ${contactName}`;
    } else if (contextLower.includes('meeting')) {
      return `Great meeting you, ${contactName}`;
    } else if (contextLower.includes('connect')) {
      return `Let's connect - ${contactName}`;
    } else if (contextLower.includes('collaboration') || contextLower.includes('partner')) {
      return `Collaboration opportunity - ${contactName}`;
    }
  }

  // Default subject
  return `Nice meeting you, ${contactName}`;
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

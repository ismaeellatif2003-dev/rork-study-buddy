/**
 * Email Service using Resend API
 * Sends transactional emails like welcome emails to new users
 */

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private webAppUrl: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'; // Resend default test domain
    this.webAppUrl = process.env.WEB_APP_URL || process.env.CORS_ORIGIN || 'https://study-buddy-web.vercel.app';
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    if (!this.apiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured. Skipping welcome email.');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: userEmail,
          subject: 'Welcome to Study Buddy! 🎓',
          html: this.getWelcomeEmailTemplate(userName),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${response.status} - ${error}`);
      }

      const result = await response.json() as { id?: string };
      console.log(`✅ Welcome email sent to ${userEmail}${result.id ? ` (ID: ${result.id})` : ''}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Don't throw - email failure shouldn't break user creation
    }
  }

  /**
   * Get welcome email HTML template
   */
  private getWelcomeEmailTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; margin: 20px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Study Buddy! 🎓</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your AI-powered study assistant</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">Hi ${userName},</p>
      
      <p style="font-size: 16px; margin: 0 0 20px 0; color: #555555;">
        We're thrilled to have you join Study Buddy! Your AI-powered study assistant is ready to help you learn faster, ace your exams, and make studying more efficient.
      </p>

      <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 20px;">What you can do:</h2>
        <ul style="margin: 0; padding-left: 20px; color: #555555;">
          <li style="margin-bottom: 10px;"><strong>📝 Smart Notes</strong> - Create notes with AI-powered summaries</li>
          <li style="margin-bottom: 10px;"><strong>🎴 Flashcards</strong> - Generate flashcards from your study materials</li>
          <li style="margin-bottom: 10px;"><strong>💬 AI Chat</strong> - Ask questions about your notes and get personalized answers</li>
          <li style="margin-bottom: 10px;"><strong>✍️ Essay Writer</strong> - Write better essays with AI assistance</li>
          <li style="margin-bottom: 10px;"><strong>📚 Cross-Platform Sync</strong> - Access your study materials on web, mobile, and Chrome extension</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${this.webAppUrl}" 
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
          Get Started →
        </a>
      </div>

      <p style="font-size: 16px; margin: 30px 0 0 0; color: #555555;">
        If you have any questions or need help getting started, feel free to reach out. We're here to help you succeed!
      </p>

      <p style="font-size: 16px; margin: 20px 0 0 0; color: #555555;">
        Happy studying! 📚✨
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
        <strong>The Study Buddy Team</strong>
      </p>
      <p style="margin: 0; color: #999999; font-size: 12px;">
        You're receiving this email because you signed up for Study Buddy.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

// Export singleton instance
export const emailService = new EmailService();


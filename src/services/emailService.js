/**
 * Email Service for Frontend
 * Handles all email sending functionality via backend API calls
 * Note: nodemailer cannot be used directly in browser environments
 */

class EmailService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';
    this.fromName = import.meta.env.VITE_EMAIL_FROM_NAME || 'Expense Manager Pro';
    this.fromAddress = import.meta.env.VITE_EMAIL_FROM_ADDRESS || 'noreply@expensemanagerpro.com';
  }

  /**
   * Send email via backend API
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.html - HTML content
   * @param {string} emailData.text - Plain text content (optional)
   */
  async sendEmail(emailData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `"${this.fromName}" <${this.fromAddress}>`,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text || null
        })
      });

      console.log("just test",response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Email sent successfully:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw {
        success: false,
        error: error.message,
        code: error.code || 'EMAIL_SEND_ERROR'
      };
    }
  }

  /**
   * Send welcome email to new user
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.name - Recipient name
   * @param {string} params.password - User password
   */
  async sendWelcomeEmail({ email, name, password, licenseKey }) {
    try {
      const emailData = {
        to: email,
        subject: 'Welcome to Expense Manager Pro!',
        html: `
          <h2>Welcome ${name}!</h2>
          <p>Your account has been created successfully.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          ${licenseKey ? `<p><strong>License Key:</strong> ${licenseKey}</p>` : ''}
        `
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.name - Recipient name
   * @param {string} params.resetLink - Password reset link
   */
  async sendPasswordResetEmail({ email, name, resetLink }) {
    try {
      const emailData = {
        to: email,
        subject: 'Reset Your Password',
        html: `
          <h2>Hi ${name},</h2>
          <p>Reset your password: <a href="${resetLink}">Click here</a></p>
        `
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send email verification email
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.name - Recipient name
   * @param {string} params.verificationLink - Email verification link
   */
  async sendEmailVerificationEmail({ email, name, verificationLink }) {
    try {
      const emailData = {
        to: email,
        subject: 'Verify Your Email',
        html: `
          <h2>Hi ${name},</h2>
          <p>Verify your email: <a href="${verificationLink}">Click here</a></p>
        `
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending email verification email:', error);
      throw error;
    }
  }

  /**
   * Send license key email for upgraded users
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.name - Recipient name
   * @param {string} params.licenseKey - License key
   */
  async sendLicenseKeyEmail({ email, name, licenseKey }) {
    try {
      const emailData = {
        to: email,
        subject: 'Your Expense Manager Pro License Key',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Thank you for upgrading to Expense Manager Pro!</h2>
            <p>Hi ${name || 'there'},</p>
            <p>Your payment has been processed successfully. Here is your license key:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <strong style="font-size: 18px; color: #1f2937; font-family: monospace;">${licenseKey}</strong>
            </div>
            <p>Please save this license key in a secure location. You can use it to activate your premium features.</p>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The Expense Manager Pro Team</p>
          </div>
        `
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending license key email:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   * Sends a test email to verify backend email service
   * @param {string} testEmail - Email address to send test email to
   */
  async sendTestEmail(testEmail) {
    try {
      const emailData = {
        to: testEmail,
        subject: 'Test Email',
        html: `
          <h2>Test Email</h2>
          <p>Email service is working.</p>
        `
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }

  /**
   * Check if email service is available
   * @returns {Promise<boolean>} True if service is available
   */
  async isServiceAvailable() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/email-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Email service not available:', error.message);
      return false;
    }
  }
}

export default new EmailService();
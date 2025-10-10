import nodemailer from 'nodemailer';
import config from '../config';
import logger from './logger';

/**
 * Email Service
 * 
 * Handles sending various types of emails with templates and error handling
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter?: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter(): void {
    try {
      if (!config.email.user || !config.email.pass) {
        logger.warn('⚠️  Email service not configured - no credentials provided');
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: config.email.service,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 10
      });

      this.isConfigured = true;
      logger.info('📧 Email service configured successfully');
    } catch (error) {
      logger.error('❌ Failed to configure email service:', error);
    }
  }

  /**
   * Verify email configuration
   */
  async verify(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('⚠️  Email service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('✅ Email service verification successful');
      return true;
    } catch (error) {
      logger.error('❌ Email service verification failed:', error);
      return false;
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('⚠️  Attempted to send email but service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: options.from || `"Sports Companion" <${config.email.user}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Email sent successfully to ${options.to}`, { messageId: info.messageId });
      return true;
    } catch (error) {
      logger.error(`❌ Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, firstName: string, username: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(firstName, username);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<boolean> {
    const template = this.getVerificationTemplate(firstName, verificationToken);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<boolean> {
    const template = this.getPasswordResetTemplate(firstName, resetToken);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send match notification email
   */
  async sendMatchNotificationEmail(email: string, firstName: string, matchDetails: any): Promise<boolean> {
    const template = this.getMatchNotificationTemplate(firstName, matchDetails);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send tournament notification email
   */
  async sendTournamentNotificationEmail(email: string, firstName: string, tournamentDetails: any): Promise<boolean> {
    const template = this.getTournamentNotificationTemplate(firstName, tournamentDetails);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send bulk emails (e.g., newsletter)
   */
  async sendBulkEmail(recipients: string[], subject: string, html: string, text: string): Promise<{ sent: number; failed: number }> {
    if (!this.isConfigured) {
      logger.warn('⚠️  Attempted to send bulk email but service not configured');
      return { sent: 0, failed: recipients.length };
    }

    let sent = 0;
    let failed = 0;

    // Send in batches to avoid overwhelming the email service
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      try {
        await this.sendEmail({
          to: batch,
          subject,
          html,
          text
        });
        sent += batch.length;
        logger.info(`📧 Bulk email batch sent to ${batch.length} recipients`);
      } catch (error) {
        failed += batch.length;
        logger.error(`❌ Failed to send bulk email batch to ${batch.length} recipients:`, error);
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`📊 Bulk email campaign completed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Email Templates
   */

  private getWelcomeTemplate(firstName: string, username: string): EmailTemplate {
    return {
      subject: '🎉 Welcome to Sports Companion!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Sports Companion!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${firstName},</p>
            <p>Welcome to Sports Companion! We're excited to have you join our community of sports enthusiasts.</p>
            <p>Your username is: <strong>${username}</strong></p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Join your first match</li>
              <li>Create or join a tournament</li>
              <li>Connect with other players</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy playing!</p>
            <p>The Sports Companion Team</p>
          </div>
        </div>
      `,
      text: `Welcome to Sports Companion, ${firstName}! Your username is: ${username}. Start by completing your profile, joining matches, and connecting with other players. Contact support if you need help. Happy playing! - The Sports Companion Team`
    };
  }

  private getVerificationTemplate(firstName: string, verificationToken: string): EmailTemplate {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    return {
      subject: '✉️ Please verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4CAF50; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Verify Your Email</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${firstName},</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      `,
      text: `Hello ${firstName}, please verify your email address by visiting: ${verificationUrl}. This link expires in 24 hours. If you didn't create an account, ignore this email.`
    };
  }

  private getPasswordResetTemplate(firstName: string, resetToken: string): EmailTemplate {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    return {
      subject: '🔒 Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #FF9800; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Reset Your Password</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${firstName},</p>
            <p>You requested a password reset for your Sports Companion account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This reset link will expire in 1 hour.</strong></p>
            <p>If you didn't request this reset, please ignore this email.</p>
          </div>
        </div>
      `,
      text: `Hello ${firstName}, reset your password by visiting: ${resetUrl}. This link expires in 1 hour. If you didn't request this, ignore this email.`
    };
  }

  private getMatchNotificationTemplate(firstName: string, matchDetails: any): EmailTemplate {
    return {
      subject: `🏆 Match Update: ${matchDetails.sport}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2196F3; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Match Update</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${firstName},</p>
            <p>There's an update for your ${matchDetails.sport} match:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Date:</strong> ${matchDetails.date}</p>
              <p><strong>Time:</strong> ${matchDetails.time}</p>
              <p><strong>Status:</strong> ${matchDetails.status}</p>
              ${matchDetails.venue ? `<p><strong>Venue:</strong> ${matchDetails.venue}</p>` : ''}
            </div>
            <p>Check your dashboard for more details and updates.</p>
          </div>
        </div>
      `,
      text: `Hello ${firstName}, match update: ${matchDetails.sport} on ${matchDetails.date} at ${matchDetails.time}. Status: ${matchDetails.status}. Check your dashboard for details.`
    };
  }

  private getTournamentNotificationTemplate(firstName: string, tournamentDetails: any): EmailTemplate {
    return {
      subject: `🏆 Tournament Update: ${tournamentDetails.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #9C27B0; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Tournament Update</h1>
          </div>
          <div style="padding: 20px;">
            <p>Hello ${firstName},</p>
            <p>There's an update for the tournament "${tournamentDetails.name}":</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Status:</strong> ${tournamentDetails.status}</p>
              <p><strong>Start Date:</strong> ${tournamentDetails.startDate}</p>
              <p><strong>Participants:</strong> ${tournamentDetails.participantCount}/${tournamentDetails.maxParticipants}</p>
            </div>
            <p>Visit your dashboard to view the bracket and stay updated with the latest matches.</p>
          </div>
        </div>
      `,
      text: `Hello ${firstName}, tournament update: ${tournamentDetails.name} - Status: ${tournamentDetails.status}. Participants: ${tournamentDetails.participantCount}/${tournamentDetails.maxParticipants}. Check your dashboard.`
    };
  }

  /**
   * Close the email service
   */
  async close(): Promise<void> {
    if (this.isConfigured && this.transporter) {
      this.transporter.close();
      logger.info('📧 Email service closed');
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;
import nodemailer from 'nodemailer';
import type { EmailLog, StoreSettings } from '../src/types.js';

export class EmailService {
  private transporter: any = null;
  private currentSmtpUser: string = '';
  private currentSmtpPass: string = '';
  private recentSentCache: Map<string, number> = new Map();

  public getTransporter(settings: StoreSettings): any {
    if (!settings.smtpUser || !settings.smtpPass) {
      this.transporter = null;
      return null;
    }

    if (
      this.transporter &&
      this.currentSmtpUser === settings.smtpUser &&
      this.currentSmtpPass === settings.smtpPass
    ) {
      return this.transporter;
    }

    this.currentSmtpUser = settings.smtpUser;
    this.currentSmtpPass = settings.smtpPass;

    this.transporter = nodemailer.createTransport({
      host: settings.smtpHost || 'smtp.gmail.com',
      port: settings.smtpPort || 465,
      secure: (settings.smtpPort || 465) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return this.transporter;
  }

  public async sendNotification(
    settings: StoreSettings,
    event: string,
    subject: string,
    htmlContent: string,
    recipients?: string[],
    forceResend: boolean = false
  ): Promise<{ success: boolean; log: EmailLog }> {
    const timestamp = new Date().toISOString();
    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    const targetRecipients = recipients && recipients.length > 0
      ? recipients
      : (settings.emailRecipients && settings.emailRecipients.length > 0
          ? settings.emailRecipients
          : [settings.contactEmail || 'admin@novashop.com']);

    const to = targetRecipients.join(', ');

    // Duplicate Notification Prevention: Check if exact same event+subject was sent to this recipient in past 60s
    const dedupeKey = `${event}:${subject}:${to}`;
    const now = Date.now();
    if (!forceResend) {
      const lastSentTime = this.recentSentCache.get(dedupeKey);
      if (lastSentTime && now - lastSentTime < 60000) {
        return {
          success: false,
          log: {
            id: logId,
            to,
            subject,
            event,
            status: 'SKIPPED',
            errorDetails: 'Duplicate notification suppressed (sent within the last 60 seconds)',
            timestamp,
          },
        };
      }
    }

    // Check if notifications are enabled
    if (!settings.emailNotificationsEnabled) {
      return {
        success: false,
        log: {
          id: logId,
          to,
          subject,
          event,
          status: 'SKIPPED',
          errorDetails: 'Email notifications are disabled in settings',
          timestamp,
        },
      };
    }

    const transporter = this.getTransporter(settings);
    if (!transporter) {
      return {
        success: false,
        log: {
          id: logId,
          to,
          subject,
          event,
          status: 'SKIPPED',
          errorDetails: 'Gmail SMTP user or App Password is not configured',
          timestamp,
        },
      };
    }

    try {
      const from = settings.smtpFrom || `"${settings.banglaShopName || settings.shopName}" <${settings.smtpUser}>`;
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });

      this.recentSentCache.set(dedupeKey, now);
      return {
        success: true,
        log: {
          id: logId,
          to,
          subject,
          event,
          status: 'SENT',
          timestamp,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        log: {
          id: logId,
          to,
          subject,
          event,
          status: 'FAILED',
          errorDetails: err.message || String(err),
          timestamp,
        },
      };
    }
  }

  public async testConnection(
    settings: StoreSettings,
    testRecipient: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    if (!settings.smtpUser || !settings.smtpPass) {
      return {
        success: false,
        message: 'Gmail SMTP User (Email) or App Password is not configured in settings.',
      };
    }

    const transporter = this.getTransporter(settings);
    if (!transporter) {
      return {
        success: false,
        message: 'Failed to initialize SMTP transporter. Please verify credentials.',
      };
    }

    try {
      await transporter.verify();

      const recipient = testRecipient || settings.smtpUser;
      const from = settings.smtpFrom || `"${settings.banglaShopName || settings.shopName}" <${settings.smtpUser}>`;

      await transporter.sendMail({
        from,
        to: recipient,
        subject: `[NOVA SHOP] SMTP Test Email - ${new Date().toLocaleTimeString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top: 0;">NOVA SHOP - ইমেইল টেস্ট সফল হয়েছে</h2>
            <p>আপনার Gmail SMTP কনফিগারেশন সঠিকভাবে কাজ করছে।</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #edf2f7; color: #718096;">Sender:</td><td style="padding: 8px; border-bottom: 1px solid #edf2f7; font-weight: bold;">${settings.smtpUser}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #edf2f7; color: #718096;">Host / Port:</td><td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${settings.smtpHost || 'smtp.gmail.com'}:${settings.smtpPort || 465}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #edf2f7; color: #718096;">Timestamp:</td><td style="padding: 8px; border-bottom: 1px solid #edf2f7;">${new Date().toISOString()}</td></tr>
            </table>
            <p style="margin-top: 20px; font-size: 13px; color: #a0aec0;">Nova Shop BD Automated System</p>
          </div>
        `,
      });

      return {
        success: true,
        message: `Test email successfully sent to ${recipient} via ${settings.smtpHost || 'smtp.gmail.com'}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `SMTP Connection / Send failed: ${err.message || String(err)}`,
        details: err,
      };
    }
  }
}

export const emailService = new EmailService();

import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Validate required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        "SMTP_USER and SMTP_PASS environment variables are required",
      );
    }

    // Initialize SMTP transporter with Microsoft 365 settings
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.office365.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Use secure TLS settings - reject unauthorized certificates in production
        rejectUnauthorized: process.env.NODE_ENV === "production",
        minVersion: "TLSv1.2",
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send email: ${message}`, stack);
      return false;
    }
  }

  // Welcome email for new subcontractor
  async sendSubcontractorWelcomeEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Welcome to Compliant Platform</h2>
        <p>Hello ${name},</p>
        <p>Your account has been created. You can now access the Compliant Platform to manage your insurance compliance.</p>
        <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Set Your Password:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p>Click the button below to set your password and activate your account:</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Set Your Password
            </a>
          </p>
          <p style="color: #6b7280; font-size: 12px;">This link will expire in 24 hours for security reasons.</p>
          <p style="color: #6b7280; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br>${resetLink}</p>
        </div>
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Set your password using the link above</li>
          <li>Log in to the platform</li>
          <li>Add your insurance broker information</li>
          <li>Your broker will upload COI documents on your behalf</li>
        </ol>
        <p>If you have any questions, please contact your General Contractor.</p>
        <p>Best regards,<br>Compliant Platform Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: "Welcome to Compliant Platform - Set Your Password",
      html,
    });
  }

  // Welcome email for new broker
  async sendBrokerWelcomeEmail(
    email: string,
    name: string,
    resetToken: string,
    subcontractorName: string,
  ): Promise<boolean> {
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Welcome to Compliant Platform - Broker Portal</h2>
        <p>Hello ${name},</p>
        <p>You have been designated as the insurance broker for <strong>${subcontractorName}</strong>. Your account has been created to upload and manage COI documents.</p>
        <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Set Your Password:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p>Click the button below to set your password and activate your account:</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Set Your Password
            </a>
          </p>
          <p style="color: #6b7280; font-size: 12px;">This link will expire in 24 hours for security reasons.</p>
          <p style="color: #6b7280; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br>${resetLink}</p>
        </div>
        <p><strong>Your Responsibilities:</strong></p>
        <ul>
          <li><strong>First-Time COI:</strong> Upload all policies (GL, Auto, Umbrella, WC) and COI document</li>
          <li><strong>Renewals:</strong> Review system-generated COI and provide digital signatures</li>
          <li>Keep all insurance documents current and up to date</li>
        </ul>
        <p>Please log in and upload the required documents as soon as possible.</p>
        <p>Best regards,<br>Compliant Platform Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: "Broker Account Created - Set Your Password",
      html,
    });
  }

  // Compliance confirmation (to GC, Sub, Broker)
  async sendComplianceConfirmationEmail(
    recipients: { gc: string; sub: string; broker: string },
    details: {
      subcontractorName: string;
      projectName: string;
      gcName: string;
    },
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✓ Insurance Compliance Confirmed</h2>
        <p>This is to confirm that insurance compliance has been verified and approved.</p>
        <div style="background-color: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0;">Details:</h3>
          <p><strong>Subcontractor:</strong> ${details.subcontractorName}</p>
          <p><strong>Project:</strong> ${details.projectName}</p>
          <p><strong>General Contractor:</strong> ${details.gcName}</p>
          <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">COMPLIANT</span></p>
        </div>
        <p>All insurance documents have been reviewed and approved. The subcontractor is now compliant and can proceed with work.</p>
        <p>Best regards,<br>Compliant Platform Team</p>
      </div>
    `;

    const emails = [recipients.gc, recipients.sub, recipients.broker].filter(
      Boolean,
    );
    return this.sendEmail({
      to: emails,
      subject: `✓ Insurance Compliance Approved - ${details.subcontractorName}`,
      html,
    });
  }

  // Non-compliance alert (to GC, Sub, Broker)
  async sendNonComplianceAlertEmail(
    recipients: { gc: string; sub: string; broker: string },
    details: {
      subcontractorName: string;
      projectName: string;
      gcName: string;
      reason: string;
    },
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Insurance Non-Compliance Alert</h2>
        <p>This is an urgent notification regarding insurance compliance status.</p>
        <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0;">Details:</h3>
          <p><strong>Subcontractor:</strong> ${details.subcontractorName}</p>
          <p><strong>Project:</strong> ${details.projectName}</p>
          <p><strong>General Contractor:</strong> ${details.gcName}</p>
          <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">NON-COMPLIANT</span></p>
          <p><strong>Reason:</strong> ${details.reason}</p>
        </div>
        <p><strong>Action Required:</strong></p>
        <ul>
          <li>Broker: Please upload updated insurance documents immediately</li>
          <li>Subcontractor: Contact your broker to resolve this issue</li>
          <li>GC: The subcontractor may not be able to work until compliance is restored</li>
        </ul>
        <p>Please address this issue as soon as possible to avoid project delays.</p>
        <p>Best regards,<br>Compliant Platform Team</p>
      </div>
    `;

    const emails = [recipients.gc, recipients.sub, recipients.broker].filter(
      Boolean,
    );
    return this.sendEmail({
      to: emails,
      subject: `⚠️ URGENT: Insurance Non-Compliance - ${details.subcontractorName}`,
      html,
    });
  }

  // Document upload notification
  async sendDocumentUploadNotificationEmail(
    adminEmail: string,
    details: {
      subcontractorName: string;
      projectName: string;
      brokerName: string;
      uploadType: "first-time" | "renewal";
    },
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">📄 New COI Documents Uploaded - Review Required</h2>
        <p>New insurance documents have been uploaded and are awaiting your review.</p>
        <div style="background-color: #eff6ff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0;">Details:</h3>
          <p><strong>Subcontractor:</strong> ${details.subcontractorName}</p>
          <p><strong>Project:</strong> ${details.projectName}</p>
          <p><strong>Uploaded by:</strong> ${details.brokerName} (Broker)</p>
          <p><strong>Type:</strong> ${details.uploadType === "first-time" ? "First-Time COI" : "Renewal COI"}</p>
        </div>
        <p>Please log in to the admin portal to review and approve these documents.</p>
        <p><a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/admin/coi-reviews" 
              style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">
           Review Documents
        </a></p>
        <p>Best regards,<br>Compliant Platform Team</p>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `📄 COI Review Required - ${details.subcontractorName}`,
      html,
    });
  }

  // Helper to strip HTML tags for plain text version
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  }
}

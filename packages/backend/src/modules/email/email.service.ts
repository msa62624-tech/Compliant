import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { SendEmailDto } from './dto/send-email.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: string;
  private readonly from: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.provider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');
    this.from = this.configService.get<string>('EMAIL_FROM', 'noreply@compliant.com');
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    try {
      this.logger.log(`Sending email to ${dto.to} using template ${dto.template}`);

      // Render template
      const html = await this.renderTemplate(dto.template, dto.variables || {});

      // Log email attempt
      const emailLog = await this.prisma.emailLog.create({
        data: {
          to: dto.to,
          from: dto.from || this.from,
          subject: dto.subject,
          template: dto.template,
          status: 'PENDING',
          metadata: dto.variables || {},
        },
      });

      try {
        // Send email based on provider
        await this.sendViaProvider(dto.to, dto.from || this.from, dto.subject, html);

        // Update status to SENT
        await this.prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        this.logger.log(`Email sent successfully to ${dto.to}`);
      } catch (error) {
        // Update status to FAILED
        await this.prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'FAILED',
            errorMsg: error.message,
          },
        });

        this.logger.error(`Failed to send email to ${dto.to}: ${error.message}`);
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error in sendEmail: ${error.message}`);
      throw error;
    }
  }

  private async renderTemplate(templateName: string, variables: Record<string, any>): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
    
    // Check if template exists, otherwise use a default template
    let templateContent: string;
    if (fs.existsSync(templatePath)) {
      templateContent = fs.readFileSync(templatePath, 'utf-8');
    } else {
      // Default template
      templateContent = '<html><body>{{message}}</body></html>';
    }

    const template = Handlebars.compile(templateContent);
    return template(variables);
  }

  private async sendViaProvider(to: string, from: string, subject: string, html: string): Promise<void> {
    // For now, just log the email. In production, implement actual provider logic.
    this.logger.log(`[${this.provider}] Email would be sent:`);
    this.logger.log(`To: ${to}`);
    this.logger.log(`From: ${from}`);
    this.logger.log(`Subject: ${subject}`);
    
    // TODO: Implement actual email sending based on provider (SendGrid, SES, SMTP)
    // For development, we're just logging
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      variables: {
        resetUrl,
        expiresIn: '1 hour',
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Compliant Platform',
      template: 'welcome',
      variables: {
        firstName,
        loginUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
      },
    });
  }
}

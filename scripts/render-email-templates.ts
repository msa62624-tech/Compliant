import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Email template renderer script
 * Generates visual renders of all email templates for documentation
 */

const EMAIL_RENDERS_DIR = join(__dirname, '..', 'docs', 'email-templates');

interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
}

function getSubcontractorWelcomeEmail(): EmailTemplate {
  const resetLink = 'http://localhost:3000/reset-password?token=abc123example';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Welcome to Compliant Platform</h2>
      <p>Hello John Doe,</p>
      <p>Your account has been created. You can now access the Compliant Platform to manage your insurance compliance.</p>
      <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">Set Your Password:</h3>
        <p><strong>Email:</strong> john.doe@example.com</p>
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

  return {
    name: '01-subcontractor-welcome-email',
    subject: 'Welcome to Compliant Platform - Set Your Password',
    html,
  };
}

function getBrokerWelcomeEmail(): EmailTemplate {
  const resetLink = 'http://localhost:3000/reset-password?token=xyz789example';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Welcome to Compliant Platform - Broker Portal</h2>
      <p>Hello Jane Smith,</p>
      <p>You have been designated as the insurance broker for <strong>ABC Construction LLC</strong>. Your account has been created to upload and manage COI documents.</p>
      <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">Set Your Password:</h3>
        <p><strong>Email:</strong> jane.smith@insurancebroker.com</p>
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

  return {
    name: '02-broker-welcome-email',
    subject: 'Broker Account Created - Set Your Password',
    html,
  };
}

function getComplianceConfirmationEmail(): EmailTemplate {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">✓ Insurance Compliance Confirmed</h2>
      <p>This is to confirm that insurance compliance has been verified and approved.</p>
      <div style="background-color: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0;">Details:</h3>
        <p><strong>Subcontractor:</strong> ABC Construction LLC</p>
        <p><strong>Project:</strong> Downtown Office Building</p>
        <p><strong>General Contractor:</strong> Premier Construction Co.</p>
        <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">COMPLIANT</span></p>
      </div>
      <p>All insurance documents have been reviewed and approved. The subcontractor is now compliant and can proceed with work.</p>
      <p>Best regards,<br>Compliant Platform Team</p>
    </div>
  `;

  return {
    name: '03-compliance-confirmation-email',
    subject: '✓ Insurance Compliance Approved - ABC Construction LLC',
    html,
  };
}

function getNonComplianceAlertEmail(): EmailTemplate {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ Insurance Non-Compliance Alert</h2>
      <p>This is an urgent notification regarding insurance compliance status.</p>
      <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
        <h3 style="margin-top: 0;">Details:</h3>
        <p><strong>Subcontractor:</strong> ABC Construction LLC</p>
        <p><strong>Project:</strong> Downtown Office Building</p>
        <p><strong>General Contractor:</strong> Premier Construction Co.</p>
        <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">NON-COMPLIANT</span></p>
        <p><strong>Reason:</strong> General Liability coverage limit does not meet project requirements ($2M required, $1M provided)</p>
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

  return {
    name: '04-non-compliance-alert-email',
    subject: '⚠️ URGENT: Insurance Non-Compliance - ABC Construction LLC',
    html,
  };
}

function getDocumentUploadNotificationEmail(): EmailTemplate {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">📄 New COI Documents Uploaded - Review Required</h2>
      <p>New insurance documents have been uploaded and are awaiting your review.</p>
      <div style="background-color: #eff6ff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h3 style="margin-top: 0;">Details:</h3>
        <p><strong>Subcontractor:</strong> ABC Construction LLC</p>
        <p><strong>Project:</strong> Downtown Office Building</p>
        <p><strong>Uploaded by:</strong> Jane Smith (Broker)</p>
        <p><strong>Type:</strong> First-Time COI</p>
      </div>
      <p>Please log in to the admin portal to review and approve these documents.</p>
      <p><a href="http://localhost:3000/admin/coi-reviews" 
            style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">
         Review Documents
      </a></p>
      <p>Best regards,<br>Compliant Platform Team</p>
    </div>
  `;

  return {
    name: '05-document-upload-notification-email',
    subject: '📄 COI Review Required - ABC Construction LLC',
    html,
  };
}

function getHoldHarmlessSignatureEmail(): EmailTemplate {
  const signatureUrl = 'http://localhost:3000/subcontractor/hold-harmless/123';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">📝 Hold Harmless Agreement - Signature Required</h2>
      <p>Hello John Doe,</p>
      <p>A Hold Harmless Agreement has been generated for your review and signature.</p>
      <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #7c3aed;">
        <h3 style="margin-top: 0;">Agreement Details:</h3>
        <p><strong>Project:</strong> Downtown Office Building</p>
        <p><strong>General Contractor:</strong> Premier Construction Co.</p>
        <p><strong>Subcontractor:</strong> ABC Construction LLC</p>
        <p><strong>Status:</strong> Awaiting Subcontractor Signature</p>
      </div>
      <p>Please log in to review and sign this agreement. This is required before work can begin.</p>
      <p style="margin: 20px 0;">
        <a href="${signatureUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Review and Sign Agreement
        </a>
      </p>
      <p><strong>What happens next:</strong></p>
      <ol>
        <li>Review the agreement terms</li>
        <li>Provide your digital signature</li>
        <li>Agreement will be sent to GC for counter-signature</li>
        <li>Once fully executed, all parties will receive a copy</li>
      </ol>
      <p style="color: #6b7280; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br>${signatureUrl}</p>
      <p>Best regards,<br>Compliant Platform Team</p>
    </div>
  `;

  return {
    name: '06-hold-harmless-signature-email',
    subject: 'Hold Harmless Agreement - Signature Required',
    html,
  };
}

async function renderEmailTemplate(template: EmailTemplate) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 800, height: 1200 },
  });

  // Create a complete HTML document
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${template.subject}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f9fafb;">
      ${template.html}
    </body>
    </html>
  `;

  // Set content and capture screenshot
  await page.setContent(fullHtml);
  await page.waitForLoadState('networkidle');

  // Save HTML file
  const htmlPath = join(EMAIL_RENDERS_DIR, `${template.name}.html`);
  await writeFile(htmlPath, fullHtml);
  console.log(`  ✓ Saved HTML: ${template.name}.html`);

  // Save screenshot
  const screenshotPath = join(EMAIL_RENDERS_DIR, `${template.name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
  console.log(`  ✓ Captured: ${template.name}.png`);

  await browser.close();
}

async function main() {
  console.log('🚀 Starting email template rendering...\n');
  console.log(`Output Directory: ${EMAIL_RENDERS_DIR}\n`);

  // Create output directory
  await mkdir(EMAIL_RENDERS_DIR, { recursive: true });
  console.log(`✓ Email templates directory created\n`);

  // Get all email templates
  const templates: EmailTemplate[] = [
    getSubcontractorWelcomeEmail(),
    getBrokerWelcomeEmail(),
    getComplianceConfirmationEmail(),
    getNonComplianceAlertEmail(),
    getDocumentUploadNotificationEmail(),
    getHoldHarmlessSignatureEmail(),
  ];

  console.log(`📧 Rendering ${templates.length} email templates...\n`);

  // Render each template
  for (const template of templates) {
    console.log(`Rendering: ${template.subject}`);
    await renderEmailTemplate(template);
    console.log('');
  }

  console.log('✅ Email template rendering complete!');
  console.log(`📁 Templates saved to: ${EMAIL_RENDERS_DIR}`);
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

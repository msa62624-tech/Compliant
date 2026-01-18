import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "./email.service";

describe("EmailService", () => {
  let service: EmailService;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules before each test
    jest.resetModules();
    // Clone the original environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("fromAddress fallback order", () => {
    it("should prioritize EMAIL_FROM over SMTP_USER", () => {
      process.env.EMAIL_PROVIDER = "test";
      process.env.EMAIL_FROM = "noreply@company.com";
      process.env.SMTP_USER = "smtp-auth@mail.com";

      const service = new EmailService();
      expect(service["fromAddress"]).toBe("noreply@company.com");
    });

    it("should use SMTP_USER when EMAIL_FROM is not set", () => {
      process.env.EMAIL_PROVIDER = "test";
      delete process.env.EMAIL_FROM;
      process.env.SMTP_USER = "smtp-user@mail.com";

      const service = new EmailService();
      expect(service["fromAddress"]).toBe("smtp-user@mail.com");
    });

    it("should use default when neither EMAIL_FROM nor SMTP_USER is set", () => {
      process.env.EMAIL_PROVIDER = "test";
      delete process.env.EMAIL_FROM;
      delete process.env.SMTP_USER;

      const service = new EmailService();
      expect(service["fromAddress"]).toBe("noreply@example.com");
    });

    it("should use EMAIL_FROM even if empty string (truthy check)", () => {
      process.env.EMAIL_PROVIDER = "test";
      process.env.EMAIL_FROM = "";
      process.env.SMTP_USER = "smtp-user@mail.com";

      const service = new EmailService();
      // Empty string is falsy, so it should fall back to SMTP_USER
      expect(service["fromAddress"]).toBe("smtp-user@mail.com");
    });
  });

  describe("email provider configuration", () => {
    it("should use test provider when EMAIL_PROVIDER is test", () => {
      process.env.EMAIL_PROVIDER = "test";
      process.env.EMAIL_FROM = "test@example.com";

      const service = new EmailService();
      expect(service["emailProvider"]).toBe("test");
    });

    it("should default to smtp when EMAIL_PROVIDER is not set", () => {
      delete process.env.EMAIL_PROVIDER;
      process.env.EMAIL_FROM = "test@example.com";
      process.env.SMTP_USER = "smtp@example.com";
      process.env.SMTP_PASS = "password";

      const service = new EmailService();
      expect(service["emailProvider"]).toBe("smtp");
    });

    it("should throw error when SMTP credentials are missing for SMTP provider", () => {
      delete process.env.EMAIL_PROVIDER; // defaults to smtp
      process.env.EMAIL_FROM = "test@example.com";
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      expect(() => new EmailService()).toThrow(
        "SMTP_USER and SMTP_PASS environment variables are required",
      );
    });

    it("should not throw error for test provider without SMTP credentials", () => {
      process.env.EMAIL_PROVIDER = "test";
      process.env.EMAIL_FROM = "test@example.com";
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      expect(() => new EmailService()).not.toThrow();
    });
  });

  describe("sendEmail", () => {
    beforeEach(() => {
      process.env.EMAIL_PROVIDER = "test";
      process.env.EMAIL_FROM = "test@example.com";
      service = new EmailService();
    });

    it("should send email successfully in test mode", async () => {
      const result = await service.sendEmail({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
      });

      expect(result).toBe(true);
    });

    it("should handle multiple recipients", async () => {
      const result = await service.sendEmail({
        to: ["recipient1@example.com", "recipient2@example.com"],
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
      });

      expect(result).toBe(true);
    });

    it("should use fromAddress from configuration", async () => {
      process.env.EMAIL_PROVIDER = "test";
      process.env.EMAIL_FROM = "custom@example.com";
      const customService = new EmailService();

      const sendMailSpy = jest.spyOn(
        customService["transporter"],
        "sendMail",
      );

      await customService.sendEmail({
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "custom@example.com",
        }),
      );
    });
  });

  describe("welcome emails", () => {
    beforeEach(() => {
      process.env.EMAIL_PROVIDER = "test";
      process.env.EMAIL_FROM = "test@example.com";
      process.env.FRONTEND_URL = "http://localhost:3000";
      service = new EmailService();
    });

    it("should send subcontractor welcome email", async () => {
      const result = await service.sendSubcontractorWelcomeEmail(
        "sub@example.com",
        "John Doe",
        "reset-token-123",
      );

      expect(result).toBe(true);
    });

    it("should send broker welcome email", async () => {
      const result = await service.sendBrokerWelcomeEmail(
        "broker@example.com",
        "Jane Smith",
        "reset-token-456",
        "Acme Corp",
      );

      expect(result).toBe(true);
    });
  });

  describe("compliance emails", () => {
    beforeEach(() => {
      process.env.EMAIL_PROVIDER = "test";
      process.env.EMAIL_FROM = "test@example.com";
      service = new EmailService();
    });

    it("should send compliance confirmation email", async () => {
      const result = await service.sendComplianceConfirmationEmail(
        {
          gc: "gc@example.com",
          sub: "sub@example.com",
          broker: "broker@example.com",
        },
        {
          subcontractorName: "Acme Corp",
          projectName: "Building Project",
          gcName: "General Contractor Inc",
        },
      );

      expect(result).toBe(true);
    });

    it("should send non-compliance alert email", async () => {
      const result = await service.sendNonComplianceAlertEmail(
        {
          gc: "gc@example.com",
          sub: "sub@example.com",
          broker: "broker@example.com",
        },
        {
          subcontractorName: "Acme Corp",
          projectName: "Building Project",
          gcName: "General Contractor Inc",
          reason: "Insurance expired",
        },
      );

      expect(result).toBe(true);
    });

    it("should send document upload notification", async () => {
      const result = await service.sendDocumentUploadNotificationEmail(
        "admin@example.com",
        {
          subcontractorName: "Acme Corp",
          projectName: "Building Project",
          brokerName: "Insurance Broker LLC",
          uploadType: "first-time",
        },
      );

      expect(result).toBe(true);
    });
  });
});

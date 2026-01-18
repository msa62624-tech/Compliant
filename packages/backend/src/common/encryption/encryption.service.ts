import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * EncryptionService provides field-level encryption/decryption
 * for sensitive data like SSN, Tax IDs, etc.
 *
 * Uses AES-256-GCM for encryption
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private encryptionKey: Buffer | null = null;

  constructor(private configService: ConfigService) {
    this.initializeKey();
  }

  private initializeKey() {
    try {
      const secret = this.configService.get<string>("ENCRYPTION_KEY");
      const salt = this.configService.get<string>("ENCRYPTION_SALT");

      if (!secret) {
        this.logger.warn(
          "ENCRYPTION_KEY not set - field encryption will not be available",
        );
        return;
      }

      if (!salt) {
        throw new Error(
          "ENCRYPTION_SALT is required but not set. " +
            "This is mandatory to prevent data loss when ENCRYPTION_KEY changes. " +
            "Generate a secure salt using: openssl rand -hex 16",
        );
      }

      // Derive a 256-bit key from the secret using scrypt
      this.encryptionKey = scryptSync(secret, salt, this.keyLength);
      this.logger.log("Encryption key initialized successfully");
    } catch (error) {
      this.logger.error(
        `Failed to initialize encryption key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Encrypt a string value
   * Returns the encrypted value as: iv:authTag:encryptedData (all in hex)
   */
  encrypt(plaintext: string): string | null {
    if (!this.encryptionKey) {
      this.logger.warn("Encryption key not available - returning null");
      return null;
    }

    if (!plaintext) {
      return null;
    }

    try {
      // Generate a random IV for each encryption
      const iv = randomBytes(16);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt the data
      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Get the auth tag (for GCM mode authentication)
      const authTag = cipher.getAuthTag();

      // Return iv:authTag:encrypted (all in hex)
      return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
      this.logger.error(
        `Encryption error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Decrypt an encrypted value
   * Expects format: iv:authTag:encryptedData (all in hex)
   */
  decrypt(ciphertext: string): string | null {
    if (!this.encryptionKey) {
      this.logger.warn("Encryption key not available - returning null");
      return null;
    }

    if (!ciphertext) {
      return null;
    }

    try {
      // Split the ciphertext into its components
      const parts = ciphertext.split(":");
      if (parts.length !== 3) {
        this.logger.error("Invalid ciphertext format");
        return null;
      }

      const [ivHex, authTagHex, encryptedHex] = parts;

      // Convert from hex
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const encrypted = Buffer.from(encryptedHex, "hex");

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString("utf8");
    } catch (error) {
      this.logger.error(
        `Decryption error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Check if a value is encrypted (has the expected format)
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;
    const parts = value.split(":");
    return parts.length === 3;
  }

  /**
   * Encrypt an object's sensitive fields
   * @param obj The object to encrypt
   * @param fields Array of field names to encrypt
   */
  encryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
    const result = { ...obj };

    for (const field of fields) {
      if (result[field] && typeof result[field] === "string") {
        const encrypted = this.encrypt(result[field]);
        if (encrypted) {
          (result as any)[field] = encrypted;
        }
      }
    }

    return result;
  }

  /**
   * Decrypt an object's sensitive fields
   * @param obj The object to decrypt
   * @param fields Array of field names to decrypt
   */
  decryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
    const result = { ...obj };

    for (const field of fields) {
      if (
        result[field] &&
        typeof result[field] === "string" &&
        this.isEncrypted(result[field])
      ) {
        const decrypted = this.decrypt(result[field]);
        if (decrypted) {
          (result as any)[field] = decrypted;
        }
      }
    }

    return result;
  }
}

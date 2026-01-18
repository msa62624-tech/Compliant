import { Transform } from "class-transformer";

/**
 * Sanitize string input with light XSS protection
 *
 * WARNING: This provides BASIC protection only. For user-facing fields like names,
 * addresses, phone numbers, etc., USE @SanitizeHtml() INSTEAD, which provides
 * comprehensive protection by removing all HTML tags and dangerous characters.
 *
 * This decorator is kept for backward compatibility and specific use cases where
 * you want to preserve some formatting but still block obvious XSS vectors.
 *
 * @example
 * ```typescript
 * export class SomeDto {
 *   @SanitizeHtml()  // Recommended - use this for most text fields
 *   name: string;
 * }
 * ```
 */
export function SanitizeString() {
  return Transform(({ value }) => {
    if (typeof value !== "string") {
      return value;
    }

    // Trim whitespace and remove null bytes
    let sanitized = value.trim().replace(/\0/g, "");

    // Basic XSS protection - remove obvious vectors
    // Note: This is not comprehensive. Use @SanitizeHtml() for better protection.
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "");

    return sanitized;
  });
}

/**
 * Sanitize HTML content - COMPREHENSIVE XSS Protection
 *
 * Strips ALL HTML tags and dangerous characters, leaving only plain text.
 * This is the RECOMMENDED sanitizer for all user-facing text fields like:
 * - Names (broker names, user names, contractor names)
 * - Phone numbers
 * - Addresses
 * - Any other plain text field
 *
 * Security approach:
 * 1. Removes all HTML tags including malformed ones
 * 2. Strips angle brackets to prevent tag injection
 * 3. Removes event handlers (onclick, etc.)
 * 4. Removes dangerous protocols (javascript:, vbscript:, data:)
 * 5. Encodes remaining special characters
 * 6. Removes null bytes
 *
 * This provides defense-in-depth protection against XSS attacks.
 *
 * @example
 * ```typescript
 * export class UpdateBrokerInfoDto {
 *   @SanitizeHtml()  // Recommended for all plain text fields
 *   @IsString()
 *   brokerName?: string;
 * }
 * ```
 */
export function SanitizeHtml() {
  return Transform(({ value }) => {
    if (typeof value !== "string") {
      return value;
    }

    // Trim whitespace
    let sanitized = value.trim();

    // Remove null bytes first
    sanitized = sanitized.replace(/\0/g, "");

    // For fields that should only contain plain text (names, phone numbers, etc.),
    // we take an aggressive approach and strip everything that looks like HTML/scripts

    // Remove all HTML tags (handles malformed tags and variations)
    // This regex handles: <tag>, <tag >, <tag/>, <tag attr="value">, etc.
    sanitized = sanitized.replace(/<[^>]*>/gi, "");

    // Remove any remaining angle brackets that could be used for tags
    sanitized = sanitized.replace(/</g, "");
    sanitized = sanitized.replace(/>/g, "");

    // Remove event handlers and javascript: protocol if they somehow remain
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/vbscript:/gi, "");
    sanitized = sanitized.replace(/data:text\/html/gi, "");

    // Final cleanup - encode any remaining special characters
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    return sanitized;
  });
}

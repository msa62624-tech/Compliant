import * as DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes text input to prevent XSS attacks
 * @param text - The text to sanitize
 * @returns Sanitized text safe for storage and display, or undefined/null if input is undefined/null
 */
export function sanitizeText(text: string | undefined | null): string | undefined | null {
  if (text === undefined || text === null) {
    return text;
  }
  
  return DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [] // Strip all attributes
  });
}

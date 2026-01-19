/**
 * Validates if a URL is a valid file URL
 * @param url - The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidFileUrl(url: string | undefined): boolean {
  if (!url) {
    return true; // Optional fields are valid when empty
  }

  try {
    const parsedUrl = new URL(url);

    // Check if protocol is https or http
    if (!["https:", "http:"].includes(parsedUrl.protocol)) {
      return false;
    }

    // Check if hostname is not empty
    if (!parsedUrl.hostname) {
      return false;
    }

    // Validate common file extensions for policy documents
    const validExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const pathname = parsedUrl.pathname.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) =>
      pathname.endsWith(ext),
    );

    // Validate trusted cloud storage domains (exact match or proper subdomain)
    // Only specific S3 services, not all AWS services
    const trustedDomains = [
      ".s3.amazonaws.com",
      ".s3-website.amazonaws.com",
      ".s3-website-us-east-1.amazonaws.com",
      ".s3-website-us-west-2.amazonaws.com",
      ".blob.core.windows.net",
      ".storage.googleapis.com",
    ];
    const isTrustedDomain = trustedDomains.some(
      (domain) =>
        parsedUrl.hostname === domain.slice(1) || // exact match without leading dot
        parsedUrl.hostname.endsWith(domain), // proper subdomain match
    );

    // For non-trusted domains, require valid file extensions
    // Trusted domains can have any path structure
    return hasValidExtension || isTrustedDomain;
  } catch {
    return false;
  }
}

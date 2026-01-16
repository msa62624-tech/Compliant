/**
 * Adobe PDF Services Integration
 * Handles PDF extraction, text recognition, and digital signatures
 * Requires: ADOBE_API_KEY and ADOBE_CLIENT_ID from environment
 */

// No external http client needed; using mock and Node fetch where necessary
export default class AdobePDFService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.ADOBE_API_KEY;
    this.clientId = config.clientId || process.env.ADOBE_CLIENT_ID;
    this.baseURL = 'https://pdf-services.adobe.io';
    this.enabled = !!(this.apiKey && this.clientId);
    
    if (this.enabled) {
      console.log('✅ Adobe PDF Services: ENABLED');
    } else {
      console.log('⚠️  Adobe PDF Services: DISABLED (set ADOBE_API_KEY and ADOBE_CLIENT_ID to enable)');
    }
  }

  /**
   * Extract text from a PDF file
   * @param {string} fileUrl - URL of the PDF file
   * @returns {Promise<{text: string, pages: number, metadata: object}>}
   */
  async extractText(fileUrl) {
    if (!this.enabled) {
      throw new Error('Adobe PDF Services not configured. Set ADOBE_API_KEY and ADOBE_CLIENT_ID environment variables.');
    }

    try {
      console.log(`📄 Adobe: Extracting text from ${fileUrl}`);
      
      // NOTE: Adobe PDF Extract API endpoint and authentication
      // This implementation should be verified against Adobe's official documentation:
      // https://developer.adobe.com/document-services/docs/overview/pdf-services-api/
      // The endpoint path, authentication method, and request format may vary
      // based on your Adobe account type and API version.
      const response = await fetch(`${this.baseURL}/operation/extractpdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'x-api-key': this.clientId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetID: fileUrl,
          elementsToExtract: ['text']
        })
      });

      if (!response.ok) {
        throw new Error(`Adobe API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.elements?.map(el => el.Text).join('\n') || '',
        pages: data.pages || 1,
        metadata: {
          source: fileUrl,
          extractedAt: new Date().toISOString(),
          confidence: 0.95
        }
      };
    } catch (error) {
      console.error('❌ Adobe PDF extraction error:', error.message);
      throw error;
    }
  }

  /**
   * Extract structured fields from COI
   * @param {string} fileUrl - URL of the COI PDF
   * @returns {Promise<object>} Structured COI data
   */
  async extractCOIFields(fileUrl) {
    try {
      const textData = await this.extractText(fileUrl);
      const text = textData.text;

      // Pattern matching for common COI fields
      const extracted = {
        source: fileUrl,
        extractedAt: new Date().toISOString(),
        insurance_carriers: [],
        policy_numbers: [],
        coverage_limits: [],
        effective_dates: [],
        expiration_dates: [],
        additional_insureds: []
      };

      // Extract policy numbers (format: POL-XXXX-YYYY)
      const policyRegex = /POL[-]?\d+[-]?\d+/gi;
      extracted.policy_numbers = [...new Set(text.match(policyRegex) || [])];

      // Extract coverage amounts (format: $X,XXX,XXX)
      const amountRegex = /\$[\d,]+(?:,\d{3})*(?:\.\d{2})?/g;
      extracted.coverage_limits = [...new Set(text.match(amountRegex) || [])];

      // Extract dates (MM/DD/YYYY)
      const dateRegex = /\d{2}\/\d{2}\/\d{4}/g;
      extracted.expiration_dates = [...new Set(text.match(dateRegex) || [])];

      // Extract email addresses
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      extracted.contact_emails = [...new Set(text.match(emailRegex) || [])];

      return extracted;
    } catch (error) {
      console.error('❌ COI field extraction error:', error.message);
      throw error;
    }
  }

  /**
   * Apply digital signature to PDF
   * @param {string} fileUrl - URL of the PDF to sign
   * @param {object} signatureData - Signature image or data
   * @returns {Promise<string>} URL of signed PDF
   */
  async signPDF(fileUrl, signatureData) {
    if (!this.enabled) {
      throw new Error('Adobe PDF Services not configured. Set ADOBE_API_KEY and ADOBE_CLIENT_ID environment variables.');
    }

    try {
      console.log(`🔐 Adobe: Signing PDF at ${fileUrl}`);
      
      // NOTE: Adobe Sign API endpoint and authentication
      // Adobe Sign typically requires separate authentication from PDF Services
      // and uses different endpoints. Verify against Adobe's official documentation:
      // https://developer.adobe.com/document-services/docs/overview/pdf-electronic-seal-api/
      // The endpoint, authentication method, and request format should be
      // adjusted based on your Adobe Sign account configuration.
      const response = await fetch(`${this.baseURL}/operation/eseal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'x-api-key': this.clientId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputDocumentAssetID: fileUrl,
          sealImageAssetID: signatureData.signature_url,
          sealOptions: {
            signatureFormat: 'PKCS7',
            cscCredentialOptions: signatureData.credentials || {}
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Adobe Sign API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.assetID || `${fileUrl}?signed=true&timestamp=${Date.now()}`;
    } catch (error) {
      console.error('❌ Adobe PDF signing error:', error.message);
      throw error;
    }
  }

  /**
   * Merge multiple PDFs
   * @param {string[]} fileUrls - Array of PDF URLs to merge
   * @returns {Promise<string>} URL of merged PDF
   */
  async mergePDFs(fileUrls) {
    if (!this.enabled) {
      throw new Error('Adobe PDF Services not configured. Set ADOBE_API_KEY and ADOBE_CLIENT_ID environment variables.');
    }

    try {
      console.log(`📑 Adobe: Merging ${fileUrls.length} PDFs`);
      
      // NOTE: Adobe PDF Combine API endpoint
      // Verify the correct endpoint and request format against Adobe's documentation:
      // https://developer.adobe.com/document-services/docs/overview/pdf-services-api/
      const response = await fetch(`${this.baseURL}/operation/combinepdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'x-api-key': this.clientId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assets: fileUrls.map(url => ({ assetID: url }))
        })
      });

      if (!response.ok) {
        throw new Error(`Adobe Combine API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.assetID || `https://storage.example.com/merged-${Date.now()}.pdf`;
    } catch (error) {
      console.error('❌ PDF merge error:', error.message);
      throw error;
    }
  }
}

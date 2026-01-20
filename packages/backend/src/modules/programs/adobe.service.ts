import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Adobe PDF Services integration for signature workflows
 * Uses Adobe Sign for electronic signature collection
 */
@Injectable()
export class AdobeService {
  private readonly logger = new Logger(AdobeService.name);
  private clientId: string;
  private clientSecret: string;
  private organizationId: string;
  private baseUrl = "https://api.na1.echosign.com/api/rest/v6";
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get("ADOBE_CLIENT_ID") || "";
    this.clientSecret = this.configService.get("ADOBE_CLIENT_SECRET") || "";
    this.organizationId = this.configService.get("ADOBE_ORGANIZATION_ID") || "";

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn(
        "Adobe credentials not configured. Set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET",
      );
    }
  }

  /**
   * Get valid access token (with caching)
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException("Adobe credentials not configured");
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: "agreement_send:account agreement_sign:account",
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Adobe token request failed: ${error}`);
        throw new Error(`Adobe authentication failed: ${error}`);
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
      };
      this.accessToken = data.access_token;
      // Cache for 55 minutes (1 hour - 5 minute buffer)
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;

      this.logger.log("Adobe access token obtained");
      return this.accessToken;
    } catch (err: any) {
      this.logger.error(`Failed to get Adobe access token: ${err.message}`);
      throw new BadRequestException(
        `Adobe authentication failed: ${err.message}`,
      );
    }
  }

  /**
   * Send document for signature
   */
  async sendForSignature(params: {
    documentUrl: string;
    recipientEmail: string;
    recipientName: string;
    documentName: string;
    message?: string;
  }): Promise<{ agreementId: string; signUrl: string }> {
    const token = await this.getAccessToken();

    try {
      const payload = {
        fileInfos: [
          {
            transientDocumentId: await this.uploadDocument(
              params.documentUrl,
              token,
            ),
          },
        ],
        recipientSetInfos: [
          {
            recipientSetMemberInfos: [
              {
                email: params.recipientEmail,
                givenName: params.recipientName.split(" ")[0],
                familyName:
                  params.recipientName.split(" ").slice(1).join(" ") || "User",
              },
            ],
            recipientSetRole: "SIGNER",
            recipientSetStatus: "ACTIVE",
          },
        ],
        signatureType: "ESIGN",
        name: params.documentName,
        message: params.message || "Please sign this document",
        signatureFlow: "SENDER_SIGNATURE_NOT_REQUIRED",
        postSignOption: {
          redirectUrl: `${this.configService.get("FRONTEND_URL")}/coi/signed`,
        },
      };

      const response = await fetch(`${this.baseUrl}/agreements`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-api-user": this.organizationId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Adobe send for signature failed: ${error}`);
        throw new Error(`Send for signature failed: ${error}`);
      }

      const data = (await response.json()) as { id: string };
      const agreementId = data.id;

      // Get signing URL
      const signUrl = await this.getSigningUrl(agreementId, token);

      this.logger.log(`Document sent for signature: ${agreementId}`);
      return { agreementId, signUrl };
    } catch (err: any) {
      this.logger.error(
        `Failed to send document for signature: ${err.message}`,
      );
      throw new BadRequestException(
        `Send for signature failed: ${err.message}`,
      );
    }
  }

  /**
   * Upload temporary document
   */
  private async uploadDocument(
    documentUrl: string,
    token: string,
  ): Promise<string> {
    try {
      const documentResponse = await fetch(documentUrl);
      if (!documentResponse.ok) {
        throw new Error(`Failed to fetch document from URL: ${documentUrl}`);
      }

      const documentBuffer = await documentResponse.arrayBuffer();
      const formData = new FormData();
      formData.append(
        "File",
        new Blob([documentBuffer], { type: "application/pdf" }),
      );

      const response = await fetch(`${this.baseUrl}/transientDocuments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-user": this.organizationId,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Upload failed: ${error}`);
      }

      const data = (await response.json()) as { transientDocumentId: string };
      return data.transientDocumentId;
    } catch (err: any) {
      this.logger.error(`Document upload failed: ${err.message}`);
      throw new BadRequestException(`Document upload failed: ${err.message}`);
    }
  }

  /**
   * Get signing URL for agreement
   */
  private async getSigningUrl(
    agreementId: string,
    token: string,
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/agreements/${agreementId}/signingUrls`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-user": this.organizationId,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Get signing URL failed: ${error}`);
      }

      const data = (await response.json()) as {
        signingUrlSetInfos?: Array<{ signingUrls?: Array<{ url: string }> }>;
      };
      const signingUrl = data.signingUrlSetInfos?.[0]?.signingUrls?.[0]?.url;

      if (!signingUrl) {
        throw new Error("No signing URL returned from Adobe");
      }

      return signingUrl;
    } catch (err: any) {
      this.logger.error(`Failed to get signing URL: ${err.message}`);
      throw new BadRequestException(
        `Failed to get signing URL: ${err.message}`,
      );
    }
  }

  /**
   * Get agreement status and signed document
   */
  async getAgreementStatus(agreementId: string): Promise<{
    status: string;
    signedDocumentUrl?: string;
  }> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.baseUrl}/agreements/${agreementId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-user": this.organizationId,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Get agreement failed: ${error}`);
      }

      const data = (await response.json()) as {
        status: string;
        documentIds?: string[];
      };
      let signedDocumentUrl: string | undefined;

      // If signed, get the signed document URL
      if (data.status === "SIGNED" && data.documentIds?.[0]) {
        signedDocumentUrl = `${this.baseUrl}/agreements/${agreementId}/combinedDocument`;
      }

      return {
        status: data.status,
        signedDocumentUrl,
      };
    } catch (err: any) {
      this.logger.error(`Failed to get agreement status: ${err.message}`);
      throw new BadRequestException(
        `Failed to get agreement status: ${err.message}`,
      );
    }
  }
}

import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface ExtractedProgramData {
  name?: string;
  description?: string;
  glMinimum?: number;
  wcMinimum?: number;
  autoMinimum?: number;
  umbrellaMinimum?: number;
  requiresHoldHarmless?: boolean;
  requiresAdditionalInsured?: boolean;
  requiresWaiverSubrogation?: boolean;
  tierRequirements?: Record<string, any>;
  tradeRequirements?: Record<string, any>;
  extractedText?: string;
  confidence?: number;
}

@Injectable()
export class AIExtractionService {
  private readonly logger = new Logger(AIExtractionService.name);
  private aiProvider: "openai" | "anthropic";
  private openaiClient: any;
  private anthropicClient: any;

  constructor(private configService: ConfigService) {
    this.aiProvider = (this.configService.get("AI_PROVIDER") || "openai") as
      | "openai"
      | "anthropic";

    // Initialize AI clients if keys are provided
    const openaiKey = this.configService.get("OPENAI_API_KEY");
    const anthropicKey = this.configService.get("ANTHROPIC_API_KEY");

    if (openaiKey) {
      try {
        // Lazy load OpenAI - only import if key exists
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const OpenAI = require("openai").default;
        this.openaiClient = new OpenAI({ apiKey: openaiKey });
        this.logger.log("OpenAI client initialized");
      } catch {
        this.logger.warn(
          "OpenAI not available, install with: npm install openai",
        );
      }
    }

    if (anthropicKey) {
      try {
        // Lazy load Anthropic - only import if key exists
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Anthropic = require("@anthropic-ai/sdk").default;
        this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
        this.logger.log("Anthropic client initialized");
      } catch {
        this.logger.warn(
          "Anthropic not available, install with: npm install @anthropic-ai/sdk",
        );
      }
    }
  }

  /**
   * Extract text from PDF using pdfparse library
   */
  private async extractTextFromPdf(file: any): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(file.buffer);
      return pdfData.text || "";
    } catch (err: any) {
      this.logger.warn(
        `PDF text extraction failed (mimetype=${file.mimetype}, size=${file.size}): ${err?.message || err}`,
      );
      // Don't throw - let the caller handle gracefully by using filename fallback
      throw err;
    }
  }

  /**
   * Extract program data from PDF using AI
   */
  async extractProgramFromPdf(file: any): Promise<ExtractedProgramData> {
    try {
      if (!file || !file.buffer || file.size === 0) {
        throw new BadRequestException("PDF file not found");
      }

      // Accept common PDF mime types; some browsers send octet-stream for PDFs
      const isPdfMime = file.mimetype?.toLowerCase().includes("pdf");
      const looksLikePdf = file.originalname?.toLowerCase().endsWith(".pdf");
      const isOctetStream =
        file.mimetype?.toLowerCase() === "application/octet-stream";
      if (!isPdfMime && !(isOctetStream && looksLikePdf)) {
        throw new BadRequestException("Invalid file type. Please upload a PDF");
      }

      // Extract text from PDF; if it fails, fall back to filename text so we still return a best-effort payload
      let pdfText: string;
      try {
        pdfText = await this.extractTextFromPdf(file);
      } catch (err: any) {
        this.logger.warn(
          `Falling back after PDF text extraction error: ${err?.message || err}`,
        );
        pdfText = file.originalname || "Uploaded PDF";
      }

      if (!pdfText || pdfText.trim().length === 0) {
        this.logger.warn("No text extracted from PDF; using filename fallback");
        pdfText = file.originalname || "Uploaded PDF";
      }

      this.logger.debug(`Extracted ${pdfText.length} characters from PDF`);

      // Use appropriate AI provider
      if (this.aiProvider === "anthropic" && this.anthropicClient) {
        try {
          return await this.extractWithAnthropic(pdfText);
        } catch (err: any) {
          this.logger.warn(
            `Anthropic extraction failed, falling back to rule-based parser: ${err?.message || err}`,
          );
          return this.extractWithFallback(pdfText);
        }
      } else if (this.openaiClient) {
        try {
          return await this.extractWithOpenAI(pdfText);
        } catch (err: any) {
          this.logger.warn(
            `OpenAI extraction failed, falling back to rule-based parser: ${err?.message || err}`,
          );
          return this.extractWithFallback(pdfText);
        }
      } else {
        this.logger.warn(
          "AI provider not configured, using rule-based fallback extraction",
        );
        return this.extractWithFallback(pdfText);
      }
    } catch (err: any) {
      this.logger.error(`PDF extraction failed: ${err.message}`);
      if (err.response?.status === 400 || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(
        `Failed to extract data from PDF: ${err.message}`,
      );
    }
  }

  /**
   * Extract using OpenAI GPT-4
   */
  private async extractWithOpenAI(
    pdfText: string,
  ): Promise<ExtractedProgramData> {
    const prompt = this.buildExtractionPrompt(pdfText);

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: this.configService.get("AI_MODEL") || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: parseFloat(
          this.configService.get("AI_TEMPERATURE") || "0.2",
        ),
        max_tokens: parseInt(this.configService.get("AI_MAX_TOKENS") || "2000"),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content returned from OpenAI");
      }

      return this.parseExtractionResponse(content);
    } catch (err: any) {
      this.logger.error(`OpenAI extraction error: ${err.message}`);
      throw new BadRequestException(`OpenAI extraction failed: ${err.message}`);
    }
  }

  /**
   * Extract using Anthropic Claude
   */
  private async extractWithAnthropic(
    pdfText: string,
  ): Promise<ExtractedProgramData> {
    const prompt = this.buildExtractionPrompt(pdfText);

    try {
      const response = await this.anthropicClient.messages.create({
        model: this.configService.get("AI_MODEL") || "claude-3-opus-20240229",
        max_tokens: parseInt(this.configService.get("AI_MAX_TOKENS") || "2000"),
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0]?.text;
      if (!content) {
        throw new Error("No content returned from Anthropic");
      }

      return this.parseExtractionResponse(content);
    } catch (err: any) {
      this.logger.error(`Anthropic extraction error: ${err.message}`);
      throw new BadRequestException(
        `Anthropic extraction failed: ${err.message}`,
      );
    }
  }

  /**
   * Build extraction prompt for AI
   */
  private buildExtractionPrompt(pdfText: string): string {
    return `
You are an expert insurance document analyzer. Extract structured data from the following insurance program document.

DOCUMENT TEXT:
${pdfText}

EXTRACT AND RETURN ONLY A JSON object (no markdown, no extra text) with the following fields:
{
  "name": "Program name/title (string)",
  "description": "Brief program description (string)",
  "glMinimum": General Liability minimum coverage in dollars (number, e.g., 1000000),
  "wcMinimum": Workers Comp minimum coverage in dollars (number),
  "autoMinimum": Auto Liability minimum coverage in dollars (number),
  "umbrellaMinimum": Umbrella minimum coverage in dollars (number),
  "requiresHoldHarmless": Is hold harmless agreement required? (boolean),
  "requiresAdditionalInsured": Is additional insured required? (boolean),
  "requiresWaiverSubrogation": Is waiver of subrogation required? (boolean),
  "tierRequirements": Object with tier names as keys and requirements as values (object or null),
  "tradeRequirements": Object with trade names as keys and requirements as values (object or null),
  "confidence": Your confidence level in the extraction (0-1, e.g., 0.95)
}

IMPORTANT RULES:
1. Return ONLY valid JSON, no explanations
2. If a value is not found in the document, omit that field
3. For coverage amounts, return numbers (no dollar signs, no commas)
4. Look for keywords like "minimum", "required", "coverage", "limit", "endorsement"
5. Parse tiered requirements (Tier 1, Tier 2, etc.) if present
6. Parse trade-specific requirements (Electrical, Plumbing, HVAC, etc.) if present
7. Set confidence based on how clearly the information was stated (0.5 = unclear, 1.0 = very clear)

START WITH THE JSON:
`;
  }

  /**
   * Parse AI response into structured data
   */
  private parseExtractionResponse(responseText: string): ExtractedProgramData {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const extracted = JSON.parse(jsonMatch[0]) as ExtractedProgramData;

      // Validate and sanitize
      const result: ExtractedProgramData = {
        extractedText: responseText,
      };

      if (extracted.name) result.name = String(extracted.name).trim();
      if (extracted.description)
        result.description = String(extracted.description).trim();
      if (extracted.glMinimum !== undefined)
        result.glMinimum = this.parseNumber(extracted.glMinimum);
      if (extracted.wcMinimum !== undefined)
        result.wcMinimum = this.parseNumber(extracted.wcMinimum);
      if (extracted.autoMinimum !== undefined)
        result.autoMinimum = this.parseNumber(extracted.autoMinimum);
      if (extracted.umbrellaMinimum !== undefined)
        result.umbrellaMinimum = this.parseNumber(extracted.umbrellaMinimum);
      if (typeof extracted.requiresHoldHarmless === "boolean")
        result.requiresHoldHarmless = extracted.requiresHoldHarmless;
      if (typeof extracted.requiresAdditionalInsured === "boolean")
        result.requiresAdditionalInsured = extracted.requiresAdditionalInsured;
      if (typeof extracted.requiresWaiverSubrogation === "boolean")
        result.requiresWaiverSubrogation = extracted.requiresWaiverSubrogation;
      if (
        extracted.tierRequirements &&
        typeof extracted.tierRequirements === "object"
      )
        result.tierRequirements = extracted.tierRequirements;
      if (
        extracted.tradeRequirements &&
        typeof extracted.tradeRequirements === "object"
      )
        result.tradeRequirements = extracted.tradeRequirements;
      if (typeof extracted.confidence === "number")
        result.confidence = Math.min(1, Math.max(0, extracted.confidence));

      this.logger.debug(`Extraction complete: ${JSON.stringify(result)}`);
      return result;
    } catch (err: any) {
      this.logger.error(`Failed to parse extraction response: ${err.message}`);
      throw new BadRequestException(
        `Failed to parse AI response: ${err.message}`,
      );
    }
  }

  /**
   * Lightweight rule-based extractor to keep dev/test usable without AI keys
   */
  private extractWithFallback(pdfText: string): ExtractedProgramData {
    const normalized = pdfText.replace(/\r/g, "");
    const lower = normalized.toLowerCase();
    const lines = normalized
      .split(/\n+/)
      .map((line: string) => line.trim())
      .filter(Boolean);

    const findAmountFor = (keywords: string[]): number | undefined => {
      for (const keyword of keywords) {
        try {
          // Escape any regex special chars in keyword so plain text terms don't break the pattern
          const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Match up to 80 chars after the keyword and capture a money-like number
          const regex = new RegExp(`${escaped}[^\n]{0,80}?(\$?\d[\d,.]*)`, "i");
          const match = normalized.match(regex);
          if (match?.[1]) {
            const parsed = this.parseNumber(match[1]);
            if (parsed !== undefined) return parsed;
          }
        } catch (regexErr: any) {
          this.logger.warn(
            `Regex build failed for keyword "${keyword}": ${regexErr?.message || regexErr}`,
          );
          continue; // Skip bad keywords and keep trying others
        }
      }
      return undefined;
    };

    const glMinimum = findAmountFor([
      "general liability",
      "gl limit",
      "cgl limit",
    ]);
    const wcMinimum = findAmountFor([
      "workers comp",
      "workers compensation",
      "wc limit",
    ]);
    const autoMinimum = findAmountFor([
      "auto liability",
      "automobile liability",
      "auto limit",
    ]);
    const umbrellaMinimum = findAmountFor([
      "umbrella",
      "excess liability",
      "umbrella limit",
    ]);

    const guessName = lines[0] || undefined;
    const description = lines.slice(0, 3).join(" ");

    const confidenceSignals = [
      glMinimum,
      wcMinimum,
      autoMinimum,
      umbrellaMinimum,
    ].filter((v) => v !== undefined).length;
    const confidence = Math.min(1, 0.3 + confidenceSignals * 0.15);

    const tierLines = lines
      .filter((line) => /tier\s*\d/i.test(line))
      .slice(0, 5);
    const tierRequirements = tierLines.length
      ? tierLines.reduce((acc: Record<string, string>, line, idx) => {
          acc[`Tier ${idx + 1}`] = line;
          return acc;
        }, {})
      : undefined;

    return {
      name: guessName,
      description,
      glMinimum,
      wcMinimum,
      autoMinimum,
      umbrellaMinimum,
      requiresHoldHarmless: lower.includes("hold harmless"),
      requiresAdditionalInsured: lower.includes("additional insured"),
      requiresWaiverSubrogation: lower.includes("waiver of subrogation"),
      tierRequirements,
      extractedText: pdfText,
      confidence,
    };
  }

  /**
   * Parse number from various formats
   */
  private parseNumber(value: any): number | undefined {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      // Remove $, commas, spaces
      const cleaned = value.replace(/[$,\s]/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }
}

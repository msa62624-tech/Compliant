/**
 * AI Integration Service
 * Supports OpenAI, Anthropic Claude, and other LLM providers
 * Analyzes insurance documents for compliance, extracts data, and provides recommendations
 */

// Use global fetch available in Node 18+
export default class AIAnalysisService {
  constructor(config = {}) {
    this.provider = config.provider || process.env.AI_PROVIDER || 'openai';
    this.apiKey = config.apiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    this.model = config.model || process.env.AI_MODEL || 'gpt-4-turbo-preview';
    this.enabled = !!this.apiKey;

    if (this.enabled) {
      console.log(`✅ AI Analysis Service: ENABLED (Provider: ${this.provider}, Model: ${this.model})`);
    } else {
      console.log(`⚠️  AI Analysis Service: DISABLED (set AI_API_KEY to enable)`);
    }
  }

  /**
   * Analyze a COI for compliance with project requirements
   * @param {object} coiData - Extracted COI data
   * @param {object} requirements - Project insurance requirements
   * @returns {Promise<{analysis: object, deficiencies: array, recommendations: array}>}
   */
  async analyzeCOICompliance(coiData, requirements = {}) {
    if (!this.enabled) {
      throw new Error('AI Analysis Service not configured. Set AI_API_KEY environment variable.');
    }

    try {
      console.log('🤖 AI: Analyzing COI for compliance...');

      const prompt = this.buildCompliancePrompt(coiData, requirements);
      const response = await this.callAI(prompt);
      
      return this.parseComplianceResponse(response, coiData);
    } catch (error) {
      console.error('❌ COI compliance analysis error:', error.message);
      throw error;
    }
  }

  /**
   * Extract structured data from insurance policy text
   * @param {string} policyText - Raw text from policy document
   * @param {string} policyType - Type of policy (gl, wc, umbrella, auto)
   * @returns {Promise<object>} Structured policy data
   */
  async extractPolicyData(policyText, policyType = 'gl') {
    if (!this.enabled) {
      throw new Error('AI Analysis Service not configured. Set AI_API_KEY environment variable.');
    }

    try {
      console.log(`🤖 AI: Extracting ${policyType} policy data...`);

      const prompt = `Extract structured data from this ${policyType} insurance policy. Return valid JSON with:
{
  "policy_number": "",
  "effective_date": "YYYY-MM-DD",
  "expiration_date": "YYYY-MM-DD",
  "insurer_name": "",
  "coverage_type": "${policyType.toUpperCase()}",
  "limits": {
    "each_occurrence": "",
    "aggregate": "",
    "per_claim": ""
  },
  "deductibles": {
    "standard": "",
    "medical_only": ""
  },
  "additional_insureds": [],
  "waiver_of_subrogation": true/false,
  "endorsements": []
}

Policy text:
${policyText.substring(0, 2000)}`;

      const response = await this.callAI(prompt);
      return this.parseJSON(response);
    } catch (error) {
      console.error(`❌ Policy data extraction error:`, error.message);
      throw error;
    }
  }

  /**
   * Generate review recommendations
   * @param {object} coiData - COI data
   * @param {array} deficiencies - Identified deficiencies
   * @returns {Promise<array>} Recommendations for admin reviewer
   */
  async generateRecommendations(coiData, deficiencies = []) {
    if (!this.enabled) {
      throw new Error('AI Analysis Service not configured. Set AI_API_KEY environment variable.');
    }

    try {
      console.log('🤖 AI: Generating review recommendations...');

      const deficiencyText = deficiencies
        .map(d => `- ${d.title}: ${d.description}`)
        .join('\n');

      const prompt = `As an insurance compliance expert, review this COI and provide specific recommendations:

COI Summary:
- Insured: ${coiData.subcontractor_name || 'N/A'}
- GL Coverage: ${coiData.gl_aggregate || 'N/A'}
- WC Coverage: ${coiData.wc_policy_number ? 'Present' : 'Missing'}
- Auto Coverage: ${coiData.auto_policy_number ? 'Present' : 'Missing'}
- Umbrella Coverage: ${coiData.umbrella_policy_number ? 'Present' : 'Missing'}

Identified Issues:
${deficiencyText || 'None'}

Provide 3-5 specific, actionable recommendations for the reviewer.`;

      const response = await this.callAI(prompt);
      return this.parseRecommendations(response);
    } catch (error) {
      console.error('❌ Recommendations generation error:', error.message);
      throw error;
    }
  }

  /**
   * Assess risk level of a certificate
   * @param {object} coiData - COI data
   * @param {object} requirements - Project requirements
   * @returns {Promise<{level: string, score: number, factors: array}>}
   */
  async assessRisk(coiData, _requirements = {}) {
    if (!this.enabled) {
      throw new Error('AI Analysis Service not configured. Set AI_API_KEY environment variable.');
    }

    try {
      console.log('🤖 AI: Assessing COI risk level...');

      const prompt = `Rate the risk level (LOW, MEDIUM, HIGH, CRITICAL) of this insurance certificate on a scale 1-10:
      
Subcontractor: ${coiData.subcontractor_name}
GL Limit: ${coiData.gl_aggregate || 'Unknown'}
WC: ${coiData.wc_policy_number ? 'Yes' : 'No'}
Expiration Risk: ${this.getExpirationRisk(coiData)}

Provide JSON: {"level": "HIGH", "score": 7, "factors": ["reason1", "reason2"]}`;

      const response = await this.callAI(prompt);
      return this.parseJSON(response);
    } catch (error) {
      console.error('❌ Risk assessment error:', error.message);
      throw error;
    }
  }

  /**
   * Build compliance analysis prompt
   * @private
   */
  buildCompliancePrompt(coiData, requirements) {
    const requiredCoverages = Object.entries(requirements)
      .map(([key, val]) => `- ${key}: ${val}`)
      .join('\n');

    return `Analyze this Certificate of Insurance for compliance:

COI Details:
- Insured: ${coiData.subcontractor_name || 'Unknown'}
- GL Each Occ: ${coiData.gl_each_occurrence || 'Not specified'}
- GL Aggregate: ${coiData.gl_aggregate || 'Not specified'}
- Workers Comp: ${coiData.wc_policy_number ? 'Present' : 'MISSING'}
- Auto Coverage: ${coiData.auto_policy_number ? 'Present' : 'MISSING'}
- Umbrella: ${coiData.umbrella_policy_number ? 'Present' : 'MISSING'}
- Effective Date: ${coiData.gl_effective_date || 'Unknown'}
- Expiration Date: ${coiData.gl_expiration_date || 'Unknown'}

Required Coverages:
${requiredCoverages || 'Standard project requirements'}

Identify all deficiencies and compliance gaps. Return JSON array with objects: {severity, category, title, description, required_action}`;
  }

  /**
   * Parse AI compliance response
   * @private
   */
  parseComplianceResponse(response, coiData) {
    try {
      const deficiencies = this.parseJSON(response) || [];
      return {
        analysis: {
          compliant: deficiencies.filter(d => d.severity === 'critical').length === 0,
          deficiency_count: deficiencies.length,
          critical_count: deficiencies.filter(d => d.severity === 'critical').length,
          timestamp: new Date().toISOString()
        },
        deficiencies: deficiencies,
        summary: `Found ${deficiencies.length} issues (${deficiencies.filter(d => d.severity === 'critical').length} critical)`
      };
    } catch (error) {
      throw new Error(`Failed to parse AI compliance response: ${error.message}`);
    }
  }

  /**
   * Call AI API
   * @private
   */
  async callAI(prompt) {
    if (!this.enabled) {
      throw new Error('AI Analysis Service not configured. Set AI_API_KEY environment variable.');
    }

    try {
      if (this.provider === 'openai') {
        return await this.callOpenAI(prompt);
      } else if (this.provider === 'anthropic') {
        return await this.callClaude(prompt);
      } else {
        throw new Error(`Unsupported AI provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('❌ AI API call error:', error.message);
      throw error;
    }
  }

  /**
   * Call OpenAI API
   * @private
   */
  async callOpenAI(prompt) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are an expert insurance compliance analyst. Return responses as valid JSON when asked.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Call Anthropic Claude API
   * @private
   */
  async callClaude(prompt) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model || 'claude-opus',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        system: 'You are an expert insurance compliance analyst. Return responses as valid JSON when asked.'
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  /**
   * Parse JSON from AI response
   * @private
   */
  parseJSON(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.warn('⚠️  Could not parse JSON from AI response');
      return null;
    }
  }

  /**
   * Parse recommendations from AI response
   * @private
   */
  parseRecommendations(response) {
    try {
      const lines = response.split('\n').filter(line => line.trim());
      return lines
        .filter(line => line.match(/^\d+\.|^-|^•/))
        .map(line => line.replace(/^\d+\.|^-|^•/, '').trim())
        .filter(line => line.length > 0);
    } catch (error) {
      throw new Error(`Failed to parse AI recommendations: ${error.message}`);
    }
  }

  /**
   * Get expiration risk
   * @private
   */
  getExpirationRisk(coiData) {
    if (!coiData.gl_expiration_date) return 'Unknown';
    const expiryDate = new Date(coiData.gl_expiration_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry < 30) return 'CRITICAL (< 30 days)';
    if (daysUntilExpiry < 90) return 'HIGH (< 90 days)';
    return 'LOW';
  }
}

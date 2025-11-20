/**
 * LLM Service
 *
 * Provides local LLM integration using Ollama
 * Used for AI-assisted tasks like column mapping, data validation, etc.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';

export interface LLMConfig {
  host?: string;
  model?: string;
  enabled?: boolean;
}

export interface LLMPromptOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private client: Ollama | null = null;
  private config: LLMConfig;
  private isAvailable = false;

  constructor(config?: LLMConfig) {
    this.config = {
      host: config?.host || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
      model: config?.model || process.env.OLLAMA_MODEL || 'llama3.2',
      enabled: config?.enabled !== false,
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize Ollama client
   */
  private async initialize(): Promise<void> {
    try {
      this.client = new Ollama({ host: this.config.host });

      // Test connection
      await this.client.list();
      this.isAvailable = true;
      this.logger.log(
        `✅ LLM service initialized (host: ${this.config.host}, model: ${this.config.model})`
      );
    } catch (error) {
      this.isAvailable = false;
      this.logger.warn(
        `⚠️  LLM service not available: ${error instanceof Error ? error.message : String(error)}`
      );
      this.logger.warn('Install Ollama and pull a model to enable AI-assisted features:');
      this.logger.warn('  1. Install: https://ollama.ai');
      this.logger.warn(`  2. Pull model: ollama pull ${this.config.model}`);
    }
  }

  /**
   * Check if LLM is available
   */
  async isLLMAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    if (!this.isAvailable && this.client) {
      // Retry connection
      try {
        await this.client.list();
        this.isAvailable = true;
      } catch {
        this.isAvailable = false;
      }
    }

    return this.isAvailable;
  }

  /**
   * Generate completion from prompt
   */
  async generate(
    prompt: string,
    options?: LLMPromptOptions
  ): Promise<{ text: string; error?: string }> {
    if (!(await this.isLLMAvailable())) {
      return {
        text: '',
        error: 'LLM service not available',
      };
    }

    try {
      const response = await this.client!.generate({
        model: this.config.model!,
        prompt,
        system: options?.systemPrompt,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 500,
        },
      });

      return { text: response.response };
    } catch (error) {
      this.logger.error(
        `LLM generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        text: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Auto-map Excel columns to field names using LLM
   */
  async autoMapColumns(headers: string[]): Promise<Record<string, string> | null> {
    if (!(await this.isLLMAvailable())) {
      return null;
    }

    const systemPrompt = `You are an expert in automotive wiring harness data. Your task is to map Excel column headers to standardized field names.

Available field names:
- wireId: Wire identifier or number
- wireName: Wire name or label
- wireGauge: Wire gauge (AWG or mm²)
- wireColor: Wire color code
- wireLength: Wire length
- fromConnector: Source connector name
- fromPin: Source pin number
- fromPinLabel: Source pin label
- fromECU: Source ECU/module name
- toConnector: Destination connector name
- toPin: Destination pin number
- toPinLabel: Destination pin label
- toECU: Destination ECU/module name
- signal: Signal name or circuit
- signalType: Signal type (power, ground, CAN, etc.)
- notes: Notes or comments
- partNumber: Part number
- manufacturer: Manufacturer name

Return ONLY a JSON object mapping column headers to field names. Example:
{"Wire ID": "wireId", "From Conn": "fromConnector", "To Conn": "toConnector"}`;

    const prompt = `Map these Excel column headers to standardized field names:
${headers.map((h, i) => `${i + 1}. "${h}"`).join('\n')}

Return only the JSON mapping, no explanations.`;

    const result = await this.generate(prompt, {
      systemPrompt,
      temperature: 0.3, // Lower temperature for more deterministic output
    });

    if (result.error || !result.text) {
      return null;
    }

    try {
      // Extract JSON from response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const mapping = JSON.parse(jsonMatch[0]);
      this.logger.log('✅ LLM auto-mapped columns:', mapping);
      return mapping;
    } catch (error) {
      this.logger.warn(
        `Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * Validate wire data using LLM
   */
  async validateWireData(wireData: any): Promise<{
    isValid: boolean;
    issues?: string[];
    suggestions?: string[];
  }> {
    if (!(await this.isLLMAvailable())) {
      return { isValid: true }; // Skip validation if LLM not available
    }

    const systemPrompt = `You are an expert in automotive wiring harness validation. Analyze wire data for potential issues.`;

    const prompt = `Analyze this wire data and identify any issues or inconsistencies:
${JSON.stringify(wireData, null, 2)}

Consider:
- Missing required fields (connectors, pins)
- Invalid gauge values
- Unusual color codes
- Suspicious signal types
- Missing or incomplete data

Return a JSON object with:
{
  "isValid": true/false,
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    const result = await this.generate(prompt, {
      systemPrompt,
      temperature: 0.3,
    });

    if (result.error || !result.text) {
      return { isValid: true };
    }

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { isValid: true };
      }

      return JSON.parse(jsonMatch[0]);
    } catch {
      return { isValid: true };
    }
  }

  /**
   * Suggest connector type based on pin count and usage
   */
  async suggestConnectorType(pinCount: number, signals: string[]): Promise<string | null> {
    if (!(await this.isLLMAvailable())) {
      return null;
    }

    const systemPrompt = `You are an expert in automotive connectors. Suggest appropriate connector types based on pin count and signals.`;

    const prompt = `Suggest a specific connector type for:
- Pin count: ${pinCount}
- Signals: ${signals.join(', ')}

Return only the connector name/part number (e.g., "Molex 43025-1200", "TE AMP 1-967282-1"), no explanations.`;

    const result = await this.generate(prompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 50,
    });

    if (result.error || !result.text) {
      return null;
    }

    return result.text.trim();
  }
}

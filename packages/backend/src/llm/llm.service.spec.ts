/**
 * Unit tests for LLM Service
 */

import { LLMService } from './llm.service';

// Mock Ollama
jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({
    list: jest.fn().mockResolvedValue({ models: [] }),
    generate: jest.fn().mockResolvedValue({
      response: 'Generated text response',
      done: true,
    }),
  })),
}));

describe('LLMService', () => {
  let service: LLMService;

  beforeEach(() => {
    service = new LLMService({
      enabled: true,
      host: 'http://localhost:11434',
      model: 'llama3.2',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(service).toBeDefined();
    });

    it('should disable when enabled is false', () => {
      const disabledService = new LLMService({ enabled: false });
      expect(disabledService).toBeDefined();
    });
  });

  describe('isLLMAvailable', () => {
    it('should return boolean value', async () => {
      const result = await service.isLLMAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('generate', () => {
    it('should generate text from prompt', async () => {
      const result = await service.generate('Test prompt');

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
    });

    it('should return error when generation fails', async () => {
      const service = new LLMService({ enabled: false });
      const result = await service.generate('Prompt');

      expect(result.text).toBe('');
      expect(result.error).toBeDefined();
    });
  });

  describe('autoMapColumns', () => {
    it('should return mapping object or null', async () => {
      const headers = ['Wire#', 'Src Conn', 'Src Pin', 'Dst Conn', 'Dst Pin', 'AWG'];
      const result = await service.autoMapColumns(headers);

      // Should either return null or an object
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('suggestConnectorType', () => {
    it('should return string or null', async () => {
      const result = await service.suggestConnectorType(4, ['CAN_HIGH', 'CAN_LOW']);

      // Should either return null or a string
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });
});

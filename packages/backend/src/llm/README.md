# Local LLM Integration

This module provides local LLM integration using **Ollama** for AI-assisted features in HarnessFlow.

## Features

- **Auto-mapping Excel columns**: Automatically map Excel column headers to standardized field names
- **Data validation**: Validate wire data for inconsistencies and issues
- **Connector suggestions**: Suggest appropriate connector types based on usage
- **Future**: Wire routing optimization, design validation, etc.

## Setup

### 1. Install Ollama

Download and install Ollama from [https://ollama.ai](https://ollama.ai)

**Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**macOS:**

```bash
brew install ollama
```

**Windows:**
Download from [https://ollama.ai/download](https://ollama.ai/download)

### 2. Start Ollama Service

```bash
ollama serve
```

The service will start on `http://127.0.0.1:11434` by default.

### 3. Pull a Model

For best results with harness data, use one of these models:

**Recommended:**

```bash
ollama pull llama3.2        # Fast, 3B parameters
ollama pull llama3.2:1b     # Faster, 1B parameters
ollama pull llama3.1:8b     # More accurate, 8B parameters
```

**Alternative:**

```bash
ollama pull mistral         # 7B parameters
ollama pull phi3            # Small, fast
```

### 4. Configure Environment

Update your `.env` file:

```env
# Local LLM Configuration
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
OLLAMA_ENABLED=true
```

## Usage

### Basic Usage

```typescript
import { LLMService } from './llm/llm.service';

const llmService = new LLMService({
  host: 'http://127.0.0.1:11434',
  model: 'llama3.2',
  enabled: true,
});

// Check availability
const isAvailable = await llmService.isLLMAvailable();

// Generate text
const result = await llmService.generate('Explain wire gauges');
console.log(result.text);
```

### Auto-map Excel Columns

```typescript
const headers = ['Wire ID', 'From Conn', 'To Conn', 'Gauge', 'Color'];
const mapping = await llmService.autoMapColumns(headers);
// { "Wire ID": "wireId", "From Conn": "fromConnector", ... }
```

### Validate Wire Data

```typescript
const wireData = {
  fromConnector: 'ECU',
  fromPin: 1,
  toConnector: 'SENSOR',
  toPin: 1,
  gauge: 22,
  color: 'BK',
};

const validation = await llmService.validateWireData(wireData);
// { isValid: true, issues: [], suggestions: [] }
```

### Suggest Connector Type

```typescript
const suggestion = await llmService.suggestConnectorType(
  12, // pin count
  ['CAN_H', 'CAN_L', 'PWR', 'GND'] // signals
);
// "TE AMP 1-967282-1" or similar
```

## Integration with Excel Parser

The Excel parser automatically uses the LLM service for auto-mapping when enabled:

```typescript
import { parseExcelFile } from './ingestion/excel';

const result = parseExcelFile(buffer, {
  autoDetect: true,
  autoDetectionConfig: {
    useLLM: true, // Enable LLM-assisted mapping
  },
});
```

## Troubleshooting

### LLM not available

If you see `⚠️ LLM service not available`, check:

1. Ollama is installed and running: `ollama list`
2. Model is pulled: `ollama pull llama3.2`
3. Service is accessible: `curl http://127.0.0.1:11434`
4. Environment variables are set correctly

### Slow responses

- Use a smaller model (llama3.2:1b)
- Reduce `maxTokens` in prompt options
- Consider using GPU acceleration if available

### Disable LLM

Set in `.env`:

```env
OLLAMA_ENABLED=false
```

The application will work normally without LLM features.

## Performance

**Model comparison** (approximate):

| Model       | Size | Speed     | Quality   | Use Case                       |
| ----------- | ---- | --------- | --------- | ------------------------------ |
| llama3.2:1b | 1B   | Very Fast | Good      | Development, testing           |
| llama3.2    | 3B   | Fast      | Very Good | **Recommended for production** |
| llama3.1:8b | 8B   | Medium    | Excellent | High accuracy needs            |
| mistral     | 7B   | Medium    | Excellent | Alternative option             |

## API Reference

### LLMService

#### Methods

- `isLLMAvailable(): Promise<boolean>` - Check if LLM is available
- `generate(prompt: string, options?: LLMPromptOptions): Promise<{text: string, error?: string}>` - Generate text
- `autoMapColumns(headers: string[]): Promise<Record<string, string> | null>` - Auto-map Excel columns
- `validateWireData(wireData: any): Promise<{isValid: boolean, issues?: string[], suggestions?: string[]}>` - Validate wire data
- `suggestConnectorType(pinCount: number, signals: string[]): Promise<string | null>` - Suggest connector type

#### Configuration

```typescript
interface LLMConfig {
  host?: string; // Default: http://127.0.0.1:11434
  model?: string; // Default: llama3.2
  enabled?: boolean; // Default: true
}
```

## Future Enhancements

- Wire routing optimization
- Automated design rule checking
- Natural language harness queries
- Connector compatibility checking
- Wire gauge recommendations
- Signal type inference

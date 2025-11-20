/**
 * LLM Module
 *
 * NestJS module for local LLM integration
 */

import { Module, Global } from '@nestjs/common';
import { LLMService } from './llm.service';

@Global()
@Module({
  providers: [
    {
      provide: LLMService,
      useFactory: () => {
        return new LLMService({
          host: process.env.OLLAMA_HOST,
          model: process.env.OLLAMA_MODEL,
          enabled: process.env.OLLAMA_ENABLED !== 'false',
        });
      },
    },
  ],
  exports: [LLMService],
})
export class LLMModule {}

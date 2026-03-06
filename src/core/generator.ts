import OpenAI from 'openai';
import { ProjectAnalysis, ReadmeOptions } from './types';
import { PromptBuilder } from './prompt-builder';
import { Cache } from './cache';

export class ReadmeGenerator {
  private openai: OpenAI;
  private promptBuilder: PromptBuilder;
  private cache: Cache | null;
  private model: string;

  constructor(apiKey: string, useCache = true, model = process.env.OPENAI_MODEL || 'gpt-4o-mini') {
    this.openai = new OpenAI({ apiKey });
    this.promptBuilder = new PromptBuilder();
    this.cache = useCache ? new Cache() : null;
    this.model = model;
  }

  async generate(analysis: ProjectAnalysis, options: ReadmeOptions): Promise<string> {
    const prompt = this.promptBuilder.build(analysis, options);
    
    // Check cache
    if (this.cache) {
      const cached = this.cache.get(prompt);
      if (cached) {
        return cached;
      }
    }

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical writer specializing in creating professional README files for software projects. Generate clear, comprehensive, and well-structured documentation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const readme = response.choices[0].message.content || '';
    
    // Cache result
    if (this.cache) {
      this.cache.set(prompt, readme);
    }

    return readme;
  }
}

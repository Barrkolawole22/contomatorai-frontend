// backend/src/services/ai.service.ts
import logger from '../config/logger';
import geminiService from './gemini.service';
import type { ContentMode, ImpactFormat } from './prompt-builder.service';

// Only Gemini models are part of the active stack.
// OpenAI and Claude have been removed. Do not re-add them here without
// also wiring up the corresponding service files and env key validation.
export type AIModel = 'gemini' | 'gemini-pro';

export const MODEL_CONFIG = {
  gemini: {
    label: 'Fast',
    description: 'Gemini 2.5 Flash – quick, efficient generation',
    creditMultiplier: 1,
    service: geminiService,
    modelVariant: 'flash' as const,
    icon: '⚡',
    speed: 'fastest',
    quality: 'good',
  },
  'gemini-pro': {
    label: 'Balanced',
    description: 'Gemini 2.5 Pro + Google Search Grounding – well-researched content',
    creditMultiplier: 2,
    service: geminiService,
    modelVariant: 'pro' as const,
    enableGrounding: true,
    icon: '🌟',
    speed: 'fast',
    quality: 'better',
    fallback: 'gemini' as AIModel,
  },
} as const;

interface GenerationOptions {
  contentMode?: ContentMode;
  impactFormat?: ImpactFormat;
  niche?: string;
  tone?: string;
  writingStyle?: 'conversational' | 'academic' | 'journalistic' | 'technical' | 'creative';
  wordCount?: number;
  targetAudience?: string;
  includeHeadings?: boolean;
  includeIntroduction?: boolean;
  includeConclusion?: boolean;
  includeFAQ?: boolean;
  extraInstructions?: string;
  contentIntent?: 'informational' | 'navigational' | 'commercial' | 'transactional';
  customPrompt?: string;
  additionalContext?: string;
  seoFocus?: 'primary_keyword' | 'semantic_keywords' | 'long_tail' | 'balanced';
  callToAction?: string;
  includeStatistics?: boolean;
  includeExamples?: boolean;
  includeComparisons?: boolean;
  targetKeywordDensity?: number;
  includeInternalLinks?: boolean;
  includeExternalLinks?: boolean;
  internalLinkSuggestions?: Array<{
    url: string;
    title: string;
    description?: string;
    relevanceScore?: number;
  }>;
  maxInternalLinks?: number;
  internalLinkDensity?: number;
  sourceUrl?: string;
  sourceName?: string;
  articleImages?: Array<{ url: string; alt: string }>;
}

function isQuotaError(error: any): boolean {
  const msg = error?.message || '';
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('RESOURCE_EXHAUSTED')
  );
}

export class AIService {
  constructor() {
    logger.info('AI Service initialized with Gemini models (Flash and Pro)');
  }

  async generateBlogPost(
    keyword: string,
    model: AIModel = 'gemini',
    options: GenerationOptions = {}
  ): Promise<any> {
    const config = MODEL_CONFIG[model];
    if (!config) {
      throw new Error(
        `Invalid model: ${model}. Available models: ${Object.keys(MODEL_CONFIG).join(', ')}`
      );
    }

    const targetWordCount = options.wordCount || 1500;
    const estimatedCredits = Math.ceil(targetWordCount * config.creditMultiplier);

    logger.info(
      `Generating content with ${config.label} (${model}): ` +
        `${targetWordCount} words, mode: ${options.contentMode || 'seo_blog'}, ` +
        `format: ${options.impactFormat || 'standard'}, ~${estimatedCredits} credits`
    );

    try {
      return await this._runGeneration(keyword, model, options, targetWordCount);
    } catch (error: any) {
      const fallbackModel = (config as any).fallback as AIModel | undefined;
      if (isQuotaError(error) && fallbackModel) {
        logger.warn(
          `⚠️ ${config.label} quota exceeded — falling back to ${MODEL_CONFIG[fallbackModel].label}`
        );
        try {
          return await this._runGeneration(keyword, fallbackModel, options, targetWordCount, true);
        } catch (fallbackError: any) {
          logger.error(
            `❌ Fallback ${MODEL_CONFIG[fallbackModel].label} also failed: ${fallbackError.message}`
          );
          throw new Error(
            `Content generation failed with ${config.label} and fallback ${MODEL_CONFIG[fallbackModel].label}: ${fallbackError.message}`
          );
        }
      }

      logger.error(`❌ ${config.label} failed: ${error.message}`);
      throw new Error(`Content generation failed with ${config.label}: ${error.message}`);
    }
  }

  private async _runGeneration(
    keyword: string,
    model: AIModel,
    options: GenerationOptions,
    targetWordCount: number,
    isFallback = false
  ): Promise<any> {
    const config = MODEL_CONFIG[model];
    const startTime = Date.now();

    const serviceOptions = { ...options };
    (serviceOptions as any).modelVariant = (config as any).modelVariant;
    if (model === 'gemini-pro') {
      (serviceOptions as any).enableGrounding = true;
    }

    const content = await config.service.generateBlogPost(keyword, serviceOptions);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const actualCredits = Math.ceil(content.wordCount * config.creditMultiplier);

    logger.info(
      `✅ SUCCESS${isFallback ? ' (fallback)' : ''}: ${config.label} generated ${content.wordCount} words ` +
        `in ${duration}s (${actualCredits} credits used)`
    );

    return {
      ...content,
      model,
      modelName: config.label,
      creditsUsed: actualCredits,
      generationTime: parseFloat(duration),
      usedFallback: isFallback,
    };
  }

  getAvailableModels() {
    return Object.entries(MODEL_CONFIG).map(([key, config]) => ({
      id: key as AIModel,
      name: config.label,
      description: config.description,
      creditMultiplier: config.creditMultiplier,
      icon: config.icon,
      speed: config.speed,
      quality: config.quality,
      costPerWord: `${config.creditMultiplier}x`,
    }));
  }

  calculateCreditsNeeded(wordCount: number, model: AIModel = 'gemini'): number {
    const multiplier = MODEL_CONFIG[model]?.creditMultiplier || 1;
    return Math.ceil(wordCount * multiplier);
  }

  getRecommendedModel(priority: 'speed' | 'quality' | 'cost'): AIModel {
    switch (priority) {
      case 'speed':
      case 'cost':
        return 'gemini';
      case 'quality':
        return 'gemini-pro';
      default:
        return 'gemini-pro';
    }
  }

  async checkService(): Promise<any> {
    const result = await geminiService.checkService().catch((err: any) => ({
      status: 'error',
      error: err?.message,
    }));

    return {
      gemini: { ...result, model: 'gemini' },
    };
  }

  validateCredits(
    userCredits: number,
    wordCount: number,
    model: AIModel
  ): { valid: boolean; required: number; available: number; message?: string } {
    const required = this.calculateCreditsNeeded(wordCount, model);
    const valid = userCredits >= required;
    return {
      valid,
      required,
      available: userCredits,
      message: valid
        ? undefined
        : `Insufficient credits. Need ${required.toLocaleString()} credits but have ${userCredits.toLocaleString()}`,
    };
  }
}

export default new AIService();
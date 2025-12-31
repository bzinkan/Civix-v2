// Multi-provider AI client
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { AIProvider, AIResponse, Message } from '@/lib/types/conversation';

// Initialize all three providers
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const AI_CONFIG = {
  primary: (process.env.AI_PRIMARY_PROVIDER as AIProvider) || 'gemini',
  fallbackEnabled: process.env.AI_FALLBACK_ENABLED === 'true',

  // Model selections
  models: {
    gemini: {
      fast: 'gemini-2.0-flash-exp',
      pro: 'gemini-1.5-pro-latest',
    },
    anthropic: {
      fast: 'claude-haiku-4.0-20250514',
      pro: 'claude-sonnet-4-20250514',
    },
    openai: {
      fast: 'gpt-4o-mini',
      pro: 'gpt-4o',
    },
  },
};

/**
 * Call AI with automatic fallback
 */
export async function callAI(
  messages: Message[],
  options: {
    provider?: AIProvider;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    useProModel?: boolean;
  } = {}
): Promise<AIResponse> {
  const provider = options.provider || AI_CONFIG.primary;
  const temperature = options.temperature ?? 0;
  const maxTokens = options.maxTokens ?? 1024;

  try {
    switch (provider) {
      case 'gemini':
        return await callGemini(messages, options.systemPrompt, temperature, maxTokens, options.useProModel);
      case 'anthropic':
        return await callClaude(messages, options.systemPrompt, temperature, maxTokens, options.useProModel);
      case 'openai':
        return await callOpenAI(messages, options.systemPrompt, temperature, maxTokens, options.useProModel);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error: any) {
    console.error(`${provider} failed:`, error.message);

    // Try fallback if enabled
    if (AI_CONFIG.fallbackEnabled && !options.provider) {
      const fallbackProvider = getFallbackProvider(provider);
      console.log(`Falling back to ${fallbackProvider}`);

      return await callAI(messages, {
        ...options,
        provider: fallbackProvider,
      });
    }

    throw error;
  }
}

/**
 * Gemini implementation
 */
async function callGemini(
  messages: Message[],
  systemPrompt?: string,
  temperature: number = 0,
  maxTokens: number = 1024,
  useProModel: boolean = false
): Promise<AIResponse> {
  if (!gemini) {
    throw new Error('Gemini API key not configured');
  }

  const model = gemini.getGenerativeModel({
    model: useProModel ? AI_CONFIG.models.gemini.pro : AI_CONFIG.models.gemini.fast,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  // Build Gemini-format conversation
  const parts = [];
  if (systemPrompt) {
    parts.push({ text: `SYSTEM: ${systemPrompt}\n\n` });
  }

  for (const msg of messages) {
    const prefix = msg.role === 'user' ? 'USER' : 'ASSISTANT';
    parts.push({ text: `${prefix}: ${msg.content}\n\n` });
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
  });

  const response = result.response;
  const text = response.text();

  return {
    content: text,
    provider: 'gemini',
    tokensUsed: response.usageMetadata?.totalTokenCount,
  };
}

/**
 * Claude (Anthropic) implementation
 */
async function callClaude(
  messages: Message[],
  systemPrompt?: string,
  temperature: number = 0,
  maxTokens: number = 1024,
  useProModel: boolean = false
): Promise<AIResponse> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  // Convert messages to Claude format
  const claudeMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  const response = await anthropic.messages.create({
    model: useProModel ? AI_CONFIG.models.anthropic.pro : AI_CONFIG.models.anthropic.fast,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: claudeMessages as any,
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '';

  return {
    content: text,
    provider: 'anthropic',
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

/**
 * OpenAI implementation
 */
async function callOpenAI(
  messages: Message[],
  systemPrompt?: string,
  temperature: number = 0,
  maxTokens: number = 1024,
  useProModel: boolean = false
): Promise<AIResponse> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const openaiMessages: any[] = [];

  if (systemPrompt) {
    openaiMessages.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    openaiMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  }

  const response = await openai.chat.completions.create({
    model: useProModel ? AI_CONFIG.models.openai.pro : AI_CONFIG.models.openai.fast,
    messages: openaiMessages,
    temperature,
    max_tokens: maxTokens,
  });

  const choice = response.choices[0];
  const text = choice.message.content || '';

  return {
    content: text,
    provider: 'openai',
    tokensUsed: response.usage?.total_tokens,
  };
}

/**
 * Get fallback provider
 */
function getFallbackProvider(primary: AIProvider): AIProvider {
  // Fallback priority: gemini -> anthropic -> openai
  if (primary === 'gemini') {
    return anthropic ? 'anthropic' : 'openai';
  }
  if (primary === 'anthropic') {
    return gemini ? 'gemini' : 'openai';
  }
  return gemini ? 'gemini' : 'anthropic';
}

/**
 * Check which providers are available
 */
export function getAvailableProviders(): AIProvider[] {
  const available: AIProvider[] = [];
  if (gemini) available.push('gemini');
  if (anthropic) available.push('anthropic');
  if (openai) available.push('openai');
  return available;
}

/**
 * Test provider connectivity
 */
export async function testProvider(provider: AIProvider): Promise<boolean> {
  try {
    await callAI(
      [{ role: 'user', content: 'Hello' }],
      { provider, maxTokens: 10 }
    );
    return true;
  } catch {
    return false;
  }
}

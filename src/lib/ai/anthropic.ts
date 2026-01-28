import Anthropic from '@anthropic-ai/sdk';

// Singleton do cliente Anthropic
let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada. Adicione a variável de ambiente.');
    }

    anthropicClient = new Anthropic({
      apiKey,
    });
  }

  return anthropicClient;
}

// Modelos disponíveis
export const CLAUDE_MODELS = {
  // Rápido e barato - para chat e análises simples
  HAIKU: 'claude-3-5-haiku-latest',
  // Equilibrado - para relatórios
  SONNET: 'claude-sonnet-4-20250514',
  // Mais capaz - para análises complexas (usar com moderação)
  OPUS: 'claude-opus-4-5-20251101',
} as const;

// Custos por 1M tokens (input/output) - para tracking
export const MODEL_COSTS = {
  [CLAUDE_MODELS.HAIKU]: { input: 0.80, output: 4.0 },
  [CLAUDE_MODELS.SONNET]: { input: 3.0, output: 15.0 },
  [CLAUDE_MODELS.OPUS]: { input: 15.0, output: 75.0 },
} as const;

// Configuração padrão por tipo de uso
export const MODEL_CONFIG = {
  chat: {
    model: CLAUDE_MODELS.HAIKU,
    maxTokens: 1024,
    temperature: 0.7,
  },
  dailyReport: {
    model: CLAUDE_MODELS.SONNET,
    maxTokens: 2500,
    temperature: 0.3,
  },
  commodityReport: {
    model: CLAUDE_MODELS.SONNET,
    maxTokens: 3000,
    temperature: 0.3,
  },
  analysis: {
    model: CLAUDE_MODELS.SONNET,
    maxTokens: 1500,
    temperature: 0.2,
  },
  sentiment: {
    model: CLAUDE_MODELS.HAIKU,
    maxTokens: 256,
    temperature: 0.1,
  },
} as const;

export type ModelConfigKey = keyof typeof MODEL_CONFIG;
export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

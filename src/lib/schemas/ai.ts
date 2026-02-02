import { z } from 'zod';

// ==================== ENUMS ====================

export const ReportTypeSchema = z.enum([
  'DAILY_MARKET',
  'WEEKLY_COMMODITY',
  'CONTEXTUAL_ALERT'
]);

export const SentimentSchema = z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']);

export const PredictionDirectionSchema = z.enum(['UP', 'DOWN', 'STABLE']);

export const AnomalyTypeSchema = z.enum([
  'PRICE_SPIKE',
  'PRICE_DROP',
  'HIGH_VOLATILITY',
  'HISTORICAL_EXTREME'
]);

export const AnomalySeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const UserPlanSchema = z.enum(['free', 'pro', 'business']);

// ==================== RATE LIMITS POR PLANO ====================

export const AI_LIMITS = {
  free: {
    chatMessagesPerDay: 10,
    reportsPerDay: 3,
    predictionsPerDay: 5,
    maxTokensPerDay: 10000,
    streamingEnabled: false,
  },
  pro: {
    chatMessagesPerDay: 100,
    reportsPerDay: 20,
    predictionsPerDay: 50,
    maxTokensPerDay: 100000,
    streamingEnabled: true,
  },
  business: {
    chatMessagesPerDay: -1, // ilimitado
    reportsPerDay: -1,
    predictionsPerDay: -1,
    maxTokensPerDay: -1,
    streamingEnabled: true,
  },
} as const;

export type UserPlan = z.infer<typeof UserPlanSchema>;
export type AILimits = typeof AI_LIMITS[UserPlan];

// ==================== CHAT SCHEMAS ====================

export const ChatMessageInputSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória').max(4000, 'Mensagem muito longa'),
  conversationId: z.string().nullable().optional(),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export const ChatConversationSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
  conversationId: z.string(),
  usage: z.object({
    tokensUsed: z.number(),
    remaining: z.number(),
  }),
});

// ==================== REPORT SCHEMAS ====================

export const ReportSchema = z.object({
  id: z.string(),
  type: ReportTypeSchema,
  title: z.string(),
  content: z.string(),
  summary: z.string().nullable(),
  commoditySlug: z.string().optional(),
  generatedAt: z.string().datetime(),
  validUntil: z.string().datetime(),
});

export const DailyReportRequestSchema = z.object({
  forceRegenerate: z.boolean().default(false),
});

export const WeeklyReportRequestSchema = z.object({
  slug: z.string(),
  forceRegenerate: z.boolean().default(false),
});

// ==================== PREDICTION SCHEMAS ====================

export const PredictionHorizonSchema = z.enum(['7', '14', '30', '60', '90']);

export const PredictionRequestSchema = z.object({
  horizon: PredictionHorizonSchema.default('7'),
});

export const PredictionFactorSchema = z.object({
  name: z.string(),
  impact: z.enum(['positive', 'negative', 'neutral']),
  weight: z.number().min(0).max(1),
});

export const PredictionSchema = z.object({
  commoditySlug: z.string(),
  commodityName: z.string(),
  currentPrice: z.number(),
  predictedPrice: z.number(),
  priceChange: z.number(),
  priceChangePercent: z.number(),
  direction: PredictionDirectionSchema,
  confidence: z.number().min(0).max(100),
  horizon: z.number(),
  targetDate: z.string().datetime(),
  model: z.string(),
  factors: z.array(PredictionFactorSchema),
  generatedAt: z.string().datetime(),
});

// ==================== SENTIMENT SCHEMAS ====================

export const SentimentAnalysisSchema = z.object({
  newsUrl: z.string().url(),
  newsTitle: z.string(),
  sentiment: SentimentSchema,
  score: z.number().min(-1).max(1),
  commodities: z.array(z.string()),
  impactScore: z.number().min(0).max(1),
  analyzedAt: z.string().datetime(),
});

export const SentimentSummarySchema = z.object({
  commoditySlug: z.string(),
  overallSentiment: SentimentSchema,
  averageScore: z.number(),
  newsCount: z.number(),
  positiveCount: z.number(),
  negativeCount: z.number(),
  neutralCount: z.number(),
  recentNews: z.array(SentimentAnalysisSchema).max(5),
});

// ==================== ANOMALY SCHEMAS ====================

export const AnomalySchema = z.object({
  id: z.string(),
  commoditySlug: z.string(),
  commodityName: z.string(),
  type: AnomalyTypeSchema,
  severity: AnomalySeveritySchema,
  description: z.string(),
  detectedValue: z.number(),
  expectedRange: z.string(),
  deviationPercent: z.number(),
  detectedAt: z.string().datetime(),
});

export const AnomalyAlertSchema = z.object({
  anomalies: z.array(AnomalySchema),
  totalCount: z.number(),
  highSeverityCount: z.number(),
});

// ==================== ERROR SCHEMAS ====================

export const AIErrorSchema = z.object({
  error: z.string(),
  code: z.enum(['RATE_LIMIT', 'AUTH_REQUIRED', 'INVALID_INPUT', 'API_ERROR', 'NOT_FOUND']),
  usage: z.object({
    chatMessages: z.number(),
    reports: z.number(),
    predictions: z.number(),
    tokens: z.number(),
  }).optional(),
  limits: z.object({
    chatMessagesPerDay: z.number(),
    reportsPerDay: z.number(),
    predictionsPerDay: z.number(),
    maxTokensPerDay: z.number(),
  }).optional(),
});

// ==================== TYPE EXPORTS ====================

export type ReportType = z.infer<typeof ReportTypeSchema>;
export type Sentiment = z.infer<typeof SentimentSchema>;
export type PredictionDirection = z.infer<typeof PredictionDirectionSchema>;
export type AnomalyType = z.infer<typeof AnomalyTypeSchema>;
export type AnomalySeverity = z.infer<typeof AnomalySeveritySchema>;

export type ChatMessageInput = z.infer<typeof ChatMessageInputSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export type Report = z.infer<typeof ReportSchema>;
export type DailyReportRequest = z.infer<typeof DailyReportRequestSchema>;
export type WeeklyReportRequest = z.infer<typeof WeeklyReportRequestSchema>;

export type PredictionFactor = z.infer<typeof PredictionFactorSchema>;
export type Prediction = z.infer<typeof PredictionSchema>;
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;

export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;
export type SentimentSummary = z.infer<typeof SentimentSummarySchema>;

export type Anomaly = z.infer<typeof AnomalySchema>;
export type AnomalyAlert = z.infer<typeof AnomalyAlertSchema>;

export type AIError = z.infer<typeof AIErrorSchema>;

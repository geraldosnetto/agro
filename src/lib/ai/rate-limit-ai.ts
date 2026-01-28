import prisma from '@/lib/prisma';
import { AI_LIMITS, UserPlan } from '@/lib/schemas/ai';

interface AIUsageResult {
  allowed: boolean;
  reason?: string;
  usage: {
    chatMessages: number;
    reports: number;
    predictions: number;
    tokens: number;
  };
  limits: (typeof AI_LIMITS)[UserPlan];
  remaining: {
    chatMessages: number;
    reports: number;
    predictions: number;
    tokens: number;
  };
}

type UsageType = 'chat' | 'report' | 'prediction';

/**
 * Verifica se o usuário pode usar a feature de IA baseado no plano
 */
export async function checkAIUsage(
  userId: string,
  plan: UserPlan,
  type: UsageType,
  tokensToUse: number = 0
): Promise<AIUsageResult> {
  const limits = AI_LIMITS[plan];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Buscar ou criar registro de uso do dia
  let usage = await prisma.aIUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!usage) {
    usage = await prisma.aIUsage.create({
      data: {
        userId,
        date: today,
        chatMessages: 0,
        reportsViewed: 0,
        predictionsUsed: 0,
        tokensUsed: 0,
      },
    });
  }

  // Verificar limites (-1 = ilimitado)
  const checkLimit = (current: number, limit: number): boolean => {
    return limit === -1 || current < limit;
  };

  let allowed = true;
  let reason: string | undefined;

  switch (type) {
    case 'chat':
      if (!checkLimit(usage.chatMessages, limits.chatMessagesPerDay)) {
        allowed = false;
        reason = `Limite de ${limits.chatMessagesPerDay} mensagens/dia atingido. Faça upgrade para o plano Pro.`;
      }
      break;
    case 'report':
      if (!checkLimit(usage.reportsViewed, limits.reportsPerDay)) {
        allowed = false;
        reason = `Limite de ${limits.reportsPerDay} relatórios/dia atingido. Faça upgrade para o plano Pro.`;
      }
      break;
    case 'prediction':
      if (!checkLimit(usage.predictionsUsed, limits.predictionsPerDay)) {
        allowed = false;
        reason = `Limite de ${limits.predictionsPerDay} previsões/dia atingido. Faça upgrade para o plano Pro.`;
      }
      break;
  }

  // Verificar tokens
  if (allowed && limits.maxTokensPerDay !== -1) {
    if (usage.tokensUsed + tokensToUse > limits.maxTokensPerDay) {
      allowed = false;
      reason = 'Limite de tokens diário atingido. Faça upgrade para o plano Pro.';
    }
  }

  const calcRemaining = (current: number, limit: number): number => {
    return limit === -1 ? Infinity : Math.max(0, limit - current);
  };

  return {
    allowed,
    reason,
    usage: {
      chatMessages: usage.chatMessages,
      reports: usage.reportsViewed,
      predictions: usage.predictionsUsed,
      tokens: usage.tokensUsed,
    },
    limits,
    remaining: {
      chatMessages: calcRemaining(usage.chatMessages, limits.chatMessagesPerDay),
      reports: calcRemaining(usage.reportsViewed, limits.reportsPerDay),
      predictions: calcRemaining(usage.predictionsUsed, limits.predictionsPerDay),
      tokens: calcRemaining(usage.tokensUsed, limits.maxTokensPerDay),
    },
  };
}

/**
 * Incrementa o uso de IA do usuário
 */
export async function incrementAIUsage(
  userId: string,
  type: UsageType,
  tokensUsed: number = 0
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updateData: Record<string, { increment: number }> = {
    tokensUsed: { increment: tokensUsed },
  };

  switch (type) {
    case 'chat':
      updateData.chatMessages = { increment: 1 };
      break;
    case 'report':
      updateData.reportsViewed = { increment: 1 };
      break;
    case 'prediction':
      updateData.predictionsUsed = { increment: 1 };
      break;
  }

  await prisma.aIUsage.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      chatMessages: type === 'chat' ? 1 : 0,
      reportsViewed: type === 'report' ? 1 : 0,
      predictionsUsed: type === 'prediction' ? 1 : 0,
      tokensUsed,
    },
    update: updateData,
  });
}

/**
 * Obtém o uso atual de IA do usuário
 */
export async function getAIUsage(userId: string, plan: UserPlan): Promise<AIUsageResult> {
  return checkAIUsage(userId, plan, 'chat', 0);
}

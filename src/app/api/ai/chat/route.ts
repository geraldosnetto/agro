import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import { buildMarketContext, formatContextForPrompt } from '@/lib/ai/rag/context-builder';
import { buildChatSystemPrompt } from '@/lib/ai/prompts/chat-assistant';
import { checkAIUsage, incrementAIUsage } from '@/lib/ai/rate-limit-ai';
import { ChatMessageInputSchema, UserPlan, type ChatResponse } from '@/lib/schemas/ai';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 1. Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticação necessária', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Buscar plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const plan = (user?.plan || 'free') as UserPlan;

    // 3. Verificar rate limit
    const usageCheck = await checkAIUsage(userId, plan, 'chat');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.reason,
          code: 'RATE_LIMIT',
          usage: usageCheck.usage,
          limits: usageCheck.limits,
        },
        { status: 429 }
      );
    }

    // 4. Validar input
    const body = await request.json();

    const parseResult = ChatMessageInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Input inválido',
          code: 'INVALID_INPUT',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { message, conversationId } = parseResult.data;

    // 5. Buscar ou criar conversa
    let conversation = conversationId
      ? await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // Últimas 20 mensagens para contexto
          },
        },
      })
      : null;

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          userId,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: { messages: true },
      });
    }

    // 6. Salvar mensagem do usuário
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    // 7. Construir contexto RAG
    const marketContext = await buildMarketContext();
    const contextString = formatContextForPrompt(marketContext);
    const systemPrompt = buildChatSystemPrompt(contextString);

    // 8. Construir histórico de mensagens para Claude
    const messagesHistory = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Adicionar mensagem atual
    messagesHistory.push({ role: 'user' as const, content: message });

    // 9. Chamar Claude API
    const client = getAnthropicClient();
    const config = MODEL_CONFIG.chat;

    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemPrompt,
      messages: messagesHistory,
    });

    // 10. Extrair resposta
    const assistantContent = response.content[0];
    if (assistantContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const assistantText = assistantContent.text;
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // 11. Salvar resposta do assistente
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantText,
        tokensUsed,
        model: config.model,
      },
    });

    // 12. Incrementar uso
    await incrementAIUsage(userId, 'chat', tokensUsed);

    // 13. Retornar resposta
    const responseData: ChatResponse = {
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantText,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
      conversationId: conversation.id,
      usage: {
        tokensUsed,
        remaining: usageCheck.remaining.chatMessages - 1,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Chat API error:', error);

    // Verificar se é erro de API key
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        { error: 'Erro de configuração da IA. Contate o suporte.', code: 'API_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar mensagem', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}

// GET - Buscar histórico de conversas ou mensagens de uma conversa
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticação necessária', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    // If conversationId is provided, return messages for that conversation
    if (conversationId) {
      const conversation = await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversa não encontrada', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        conversationId: conversation.id,
        title: conversation.title,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      });
    }

    // Otherwise, return conversation list
    const conversations = await prisma.chatConversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        lastMessage: c.messages[0]?.content.slice(0, 100),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar conversas', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE - Resetar uso de IA do dia (para testes)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticação necessária', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.aIUsage.deleteMany({
      where: {
        userId: session.user.id,
        date: today,
      },
    });

    return NextResponse.json({ success: true, message: 'Uso resetado com sucesso' });
  } catch (error) {
    console.error('Reset usage error:', error);
    return NextResponse.json(
      { error: 'Erro ao resetar uso', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}

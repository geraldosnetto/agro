'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ConversationPreview {
  id: string;
  title: string | null;
  lastMessage: string;
  updatedAt: string;
}

const SUGGESTED_QUESTIONS = [
  'Como está o preço da soja hoje?',
  'Qual a tendência do boi gordo para essa semana?',
  'Compare o preço do milho com o mês passado',
  'O que está influenciando o mercado de café?',
  'Qual commodity teve maior alta hoje?',
  'Como está o dólar e qual impacto no agro?',
];

export default function AssistentePage() {
  const { status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/chat');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }, []);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/chat?conversationId=${convId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setConversationId(convId);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Erro ao carregar conversa');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      setConversationId(data.conversationId);
      setRemaining(data.usage.remaining);

      const assistantMessage: Message = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        createdAt: data.message.createdAt,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      loadConversations(); // Refresh conversation list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId]);

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === 'loading') {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assistente IndicAgro</h1>
          <p className="text-muted-foreground text-sm">
            IA especializada em commodities agrícolas brasileiras
          </p>
        </div>
        {remaining !== null && (
          <Badge variant={remaining > 5 ? 'secondary' : 'destructive'} className="ml-auto">
            {remaining === -1 ? 'Ilimitado' : `${remaining} msgs restantes`}
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - Conversations */}
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversas</CardTitle>
              <Button variant="ghost" size="sm" onClick={startNewConversation}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Nova
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma conversa ainda
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={`w-full text-left p-2 rounded-lg text-sm hover:bg-muted transition-colors ${conversationId === conv.id ? 'bg-muted' : ''
                      }`}
                    onClick={() => {
                      loadConversation(conv.id);
                    }}
                  >
                    <p className="font-medium truncate">{conv.title || 'Conversa'}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="flex flex-col min-h-[70vh]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Como posso ajudar?</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                  Pergunte sobre preços, tendências de mercado, commodities agrícolas ou qualquer
                  assunto relacionado ao agronegócio brasileiro.
                </p>

                <div className="grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                  {SUGGESTED_QUESTIONS.map((question, i) => (
                    <button
                      key={i}
                      className="text-left p-3 rounded-lg border hover:bg-muted transition-colors text-sm"
                      onClick={() => setInput(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-3 ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                      }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-muted">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-6 py-3 bg-destructive/10 text-destructive text-sm border-t">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta sobre o mercado agrícola..."
                disabled={isLoading || remaining === 0}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!input.trim() || isLoading || remaining === 0}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              O assistente usa dados do CEPEA e BCB. Não é conselho de investimento.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, Bot, User, Sparkles } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Foco no input quando abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);

      // Remover mensagem do usuário se deu erro
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Não mostrar para usuários não autenticados
  if (!session) {
    return null;
  }

  return (
    <>
      {/* Botão flutuante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Janela do chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]"
          >
            <Card className="flex flex-col h-full shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 bg-primary-foreground/20">
                    <AvatarFallback className="bg-transparent">
                      <Sparkles className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">Assistente IndicAgro</h3>
                    <p className="text-xs opacity-80">IA especializada em commodities</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 px-4">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium">Olá! Sou o assistente IndicAgro.</p>
                    <p className="text-xs mt-2">
                      Pergunte sobre preços, tendências ou mercado agrícola.
                    </p>
                    <div className="mt-4 space-y-2">
                      <button
                        className="text-xs text-primary hover:underline block w-full"
                        onClick={() => setInput('Como está o preço da soja hoje?')}
                      >
                        &quot;Como está o preço da soja hoje?&quot;
                      </button>
                      <button
                        className="text-xs text-primary hover:underline block w-full"
                        onClick={() => setInput('Qual a tendência do boi gordo?')}
                      >
                        &quot;Qual a tendência do boi gordo?&quot;
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border shadow-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-muted text-xs">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-background border shadow-sm rounded-lg px-4 py-3">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs">
                  {error}
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t bg-background">
                {remaining !== null && remaining <= 5 && remaining > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {remaining} {remaining === 1 ? 'mensagem restante' : 'mensagens restantes'} hoje
                  </p>
                )}
                {remaining === 0 && (
                  <p className="text-xs text-destructive mb-2">
                    Limite diário atingido. Faça upgrade para continuar.
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua pergunta..."
                    disabled={isLoading || remaining === 0}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading || remaining === 0}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

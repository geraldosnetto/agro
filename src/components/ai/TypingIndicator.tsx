'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

/**
 * Animated typing indicator with three bouncing dots.
 * Shows when the AI assistant is generating a response.
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="sr-only">Digitando...</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '600ms',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Typing indicator with "thinking" text message.
 * More descriptive version for contexts where space allows.
 */
export function TypingIndicatorWithText({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <TypingIndicator />
      <span className="animate-pulse">Pensando...</span>
    </div>
  );
}

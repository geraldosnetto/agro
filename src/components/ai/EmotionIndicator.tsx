'use client';

import {
    getEmotionColor,
    getEmotionEmoji,
    getEmotionLabel,
    type Emotion,
} from '@/lib/ai/prompts/sentiment';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmotionIndicatorProps {
    emotion: Emotion;
    intensity?: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function EmotionIndicator({
    emotion,
    intensity = 0.5,
    showLabel = true,
    size = 'md',
    className,
}: EmotionIndicatorProps) {
    const emoji = getEmotionEmoji(emotion);
    const label = getEmotionLabel(emotion);
    const color = getEmotionColor(emotion);

    const sizes = {
        sm: { emoji: 'text-lg', text: 'text-xs', bar: 'h-1' },
        md: { emoji: 'text-2xl', text: 'text-sm', bar: 'h-1.5' },
        lg: { emoji: 'text-3xl', text: 'text-base', bar: 'h-2' },
    };

    const s = sizes[size];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn('flex items-center gap-2', className)}>
                        <span className={cn(s.emoji, 'select-none')}>{emoji}</span>
                        <div className="flex-1">
                            {showLabel && (
                                <span className={cn(s.text, 'font-medium', color)}>{label}</span>
                            )}
                            {/* Intensity Bar */}
                            <div className={cn('w-full bg-muted rounded-full mt-1', s.bar)}>
                                <div
                                    className={cn(
                                        'rounded-full transition-all duration-300',
                                        s.bar,
                                        emotion === 'FEAR' && 'bg-amber-500',
                                        emotion === 'GREED' && 'bg-emerald-500',
                                        emotion === 'UNCERTAINTY' && 'bg-slate-500',
                                        emotion === 'CONFIDENCE' && 'bg-blue-500',
                                        emotion === 'PANIC' && 'bg-red-500',
                                        emotion === 'EUPHORIA' && 'bg-purple-500'
                                    )}
                                    style={{ width: `${intensity * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                        Intensidade: {Math.round(intensity * 100)}%
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// Versão compacta para listas
interface EmotionBadgeProps {
    emotion: Emotion;
    className?: string;
}

export function EmotionBadge({ emotion, className }: EmotionBadgeProps) {
    const emoji = getEmotionEmoji(emotion);
    const label = getEmotionLabel(emotion);
    const color = getEmotionColor(emotion);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            'bg-muted/50 border',
                            color,
                            className
                        )}
                    >
                        <span>{emoji}</span>
                        <span className="hidden sm:inline">{label}</span>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}


"use client";

import { cn } from "@/lib/utils";

interface TickerItem {
    symbol: string;
    value: number;
    change: number;
}

interface TickerProps {
    items: TickerItem[];
    className?: string;
}

export function Ticker({ items, className }: TickerProps) {
    // Duplicar itens suficientes para garantir scroll suave em telas grandes
    const content = [...items, ...items, ...items, ...items];

    return (
        <div className={cn(
            "relative z-50 w-full overflow-hidden bg-zinc-900 text-primary-foreground border-b flex items-center h-10",
            className
        )}>
            <div className="flex animate-marquee whitespace-nowrap gap-8 items-center px-4 hover:[animation-play-state:paused]">
                {content.map((item, i) => {
                    const isPositive = item.change >= 0;
                    return (
                        <div key={i} className="flex items-center gap-2 text-sm font-medium">
                            <span className="opacity-80 font-bold text-amber-500">{item.symbol}</span>
                            <span>R$ {item.value.toFixed(2)}</span>
                            <span className={cn(
                                "text-xs ml-1 flex items-center",
                                isPositive ? "text-green-400" : "text-red-400"
                            )}>
                                {isPositive ? "▲" : "▼"}
                                {Math.abs(item.change).toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
            `}</style>
        </div>
    );
}

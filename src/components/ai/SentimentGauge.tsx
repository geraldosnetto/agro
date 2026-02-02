'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentGaugeProps {
    score: number; // -1 a 1
    size?: number;
    className?: string;
    showLabel?: boolean;
}

export function SentimentGauge({
    score,
    size = 200,
    className,
    showLabel = true
}: SentimentGaugeProps) {
    // Converter score (-1 a 1) para porcentagem (0 a 100)
    // -1 = 0%, 0 = 50%, 1 = 100%
    const percentage = (Math.max(-1, Math.min(1, score)) + 1) * 50;

    // Configuração do gráfico (semi-círculo)
    const data = [
        { name: 'Negativo', value: 33.3, color: '#ef4444' }, // red-500
        { name: 'Neutro', value: 33.3, color: '#64748b' },   // slate-500 (era eab308, mas neutro slate fica melhor)
        { name: 'Positivo', value: 33.4, color: '#22c55e' }, // green-500
    ];

    // Agulha
    const cx = size / 2;
    const cy = size / 2;
    const iR = size / 2 - 40; // Inner radius
    const oR = size / 2 - 10; // Outer radius

    // Calcular ângulo da agulha (180 a 0 graus)
    // 0% = 180deg, 100% = 0deg
    const angle = 180 - (percentage * 1.8);
    const rad = (angle * Math.PI) / 180;

    // Posição da ponta da agulha
    const needleLen = oR - 10;
    const x = cx + needleLen * Math.cos(rad);
    const y = cy - needleLen * Math.sin(rad);

    // Label e cor
    let label = 'Neutro';
    let colorClass = 'text-slate-500';
    let Icon = Minus;

    if (score > 0.2) {
        label = 'Positivo';
        colorClass = 'text-green-500';
        Icon = TrendingUp;
    } else if (score < -0.2) {
        label = 'Negativo';
        colorClass = 'text-red-500';
        Icon = TrendingDown;
    }

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <div style={{ width: size, height: size / 2 + 30, overflow: 'visible', position: 'relative' }}>
                <div style={{ width: size, height: size / 2, overflow: 'hidden' }}>
                    <ResponsiveContainer width="100%" height="200%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius="60%"
                                outerRadius="100%"
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                                cornerRadius={4}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Agulha SVG customizada sobreposta */}
                <svg
                    width={size}
                    height={size / 2}
                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                >
                    {/* Base da agulha */}
                    <circle cx={cx} cy={cy} r={6} fill="currentColor" className="text-foreground" />

                    {/* Linha da agulha */}
                    <line
                        x1={cx}
                        y1={cy}
                        x2={x}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="text-foreground"
                    />
                </svg>

                {/* Valor Score Centralizado - MOVIDO PARA BAIXO DO PONTEIRO */}
                <div
                    className="absolute left-0 right-0 flex justify-center items-start"
                    style={{ top: size / 2 + 10 }}
                >
                    <span className={cn("text-3xl font-bold font-mono tracking-tighter", colorClass)}>
                        {score > 0 ? '+' : ''}{score.toFixed(2)}
                    </span>
                </div>
            </div>


            {
                showLabel && (
                    <div className="mt-2 text-center">
                        <div className={cn("flex items-center justify-center gap-2 font-medium text-lg", colorClass)}>
                            <Icon className="h-5 w-5" />
                            {label}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Score de impacto: {Math.round(percentage)}/100
                        </p>
                    </div>
                )
            }
        </div >
    );
}

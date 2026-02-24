
'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { type ProfitabilityResult } from '@/lib/calculators/profitability';
import { DollarSign, Scale, AlertCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface CalculatorResultsProps {
    result: ProfitabilityResult | null;
}

export function CalculatorResults({ result }: CalculatorResultsProps) {
    const { status } = useSession();
    const isAuthenticated = status === 'authenticated';
    if (!result) {
        return (
            <Card className="h-full flex items-center justify-center bg-muted/20 border-dashed">
                <CardContent className="text-center py-12">
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground font-medium">Preencha os dados e clique em Calcular</p>
                </CardContent>
            </Card>
        );
    }

    const {
        totalRevenue,
        totalCost,
        grossMargin,
        grossMarginPercent,
        breakevenYield,
        breakevenPrice
    } = result;

    const isPositive = grossMargin >= 0;

    return (
        <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className={cn("border-l-4", isPositive ? "border-l-green-500" : "border-l-red-500")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Margem Bruta (R$)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", isPositive ? "text-positive" : "text-negative")}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grossMargin)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {grossMarginPercent.toFixed(1)}% de rentabilidade
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Custo de Produção / Análise */}
            <Card className="relative overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Análise de Equilíbrio
                        {!isAuthenticated && <Lock className="h-4 w-4 ml-2 text-muted-foreground" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 relative">

                    <div className={cn("transition-all duration-300", !isAuthenticated && "blur-md select-none pointer-events-none opacity-40")}>
                        {/* Indicadores de Nivelamento */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Preço de Nivelamento</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Preço mínimo de venda para cobrir os custos.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-primary">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(breakevenPrice)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">/ saca</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Custo por saca produzida
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Produtividade de Nivelamento</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">Quanto você precisa colher por hectare para pagar o custo.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-primary">
                                        {breakevenYield.toFixed(1)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">sc/ha</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Ponto de equilíbrio produtivo
                                </div>
                            </div>
                        </div>

                        <Separator className="my-8" />

                        {/* Barra Visual de Lucratividade */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Custo ({grossMarginPercent < 0 ? 'Prejuízo' : (100 - grossMarginPercent).toFixed(1)}%)</span>
                                <span>Margem ({grossMarginPercent.toFixed(1)}%)</span>
                            </div>
                            <Progress value={Math.max(0, Math.min(100, (totalCost / totalRevenue) * 100))} className="h-3" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0%</span>
                                <span>Receita Total (100%)</span>
                            </div>
                        </div>
                    </div>

                    {!isAuthenticated && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-gradient-to-t from-card via-card/80 to-transparent backdrop-blur-[2px]">
                            <div className="bg-card/90 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-xl text-center max-w-sm space-y-4 transform translate-y-4">
                                <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                                <h3 className="font-semibold text-lg">Análise Detalhada Bloqueada</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Crie sua conta gratuitamente para acessar o ponto de equilíbrio, metas de produtividade e simulações detalhadas.
                                </p>
                                <div className="flex flex-col gap-2 w-full">
                                    <Link href="/cadastro" className="w-full">
                                        <Button className="w-full">Criar Conta Grátis</Button>
                                    </Link>
                                    <Link href="/login" className="w-full">
                                        <Button variant="ghost" className="w-full">Já tenho conta</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}

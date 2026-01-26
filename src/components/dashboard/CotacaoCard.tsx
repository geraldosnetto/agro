"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SparklineChart } from "./SparklineChart";
import { FavoriteButton } from "@/components/FavoriteButton";

export type CotacaoCategoria = "graos" | "pecuaria" | "sucroenergetico" | "fibras" | "outros";

interface CotacaoCardProps {
    slug: string;
    nome: string;
    valor: number;
    unidade: string;
    variacao: number;
    categoria: CotacaoCategoria;
    praca?: string;
    dataAtualizacao?: string;
}

const categoriaConfig: Record<CotacaoCategoria, { label: string; className: string }> = {
    graos: {
        label: "Grãos",
        className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    },
    pecuaria: {
        label: "Pecuária",
        className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    },
    sucroenergetico: {
        label: "Sucroenergetico",
        className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    },
    fibras: {
        label: "Fibras",
        className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    },
    outros: {
        label: "Outros",
        className: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    },
};

export function CotacaoCard({
    slug,
    nome,
    valor,
    unidade,
    variacao,
    categoria,
    praca,
    dataAtualizacao,
}: CotacaoCardProps) {
    const isPositive = variacao >= 0;
    const config = categoriaConfig[categoria];

    return (
        <Link href={`/cotacoes/${slug}`} className="block">
            <Card
                className={cn(
                    "group relative overflow-hidden transition-all duration-300",
                    "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
                    "border-border/50 bg-card cursor-pointer"
                )}
            >
                {/* Gradient accent bar */}
                <div
                    className={cn(
                        "absolute top-0 left-0 right-0 h-1",
                        categoria === "graos" && "bg-chart-1",
                        categoria === "pecuaria" && "bg-chart-2",
                        categoria === "sucroenergetico" && "bg-chart-3",
                        categoria === "fibras" && "bg-chart-4",
                        categoria === "outros" && "bg-chart-5"
                    )}
                />

                <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-h-[56px]">
                            <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2">
                                {nome}
                            </h3>
                            {praca && (
                                <p className="text-xs text-muted-foreground">{praca}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <FavoriteButton commoditySlug={slug} size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Badge variant="outline" className={cn("text-xs", config.className)}>
                                {config.label}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* Valor */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">
                            R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm text-muted-foreground">/{unidade}</span>
                    </div>

                    {/* Variação */}
                    <div className="flex items-center justify-between">
                        <div
                            className={cn(
                                "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full border",
                                isPositive
                                    ? "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900"
                                    : "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900"
                            )}
                        >
                            {isPositive ? (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            ) : (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                            )}
                            <span>
                                {isPositive ? "+" : ""}
                                {variacao.toFixed(2)}%
                            </span>
                        </div>

                        {dataAtualizacao && (
                            <span className="text-xs text-muted-foreground">
                                {dataAtualizacao}
                            </span>
                        )}
                    </div>

                    {/* Sparkline chart */}
                    <div className="h-12 w-full rounded-md overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity">
                        <SparklineChart slug={slug} isPositive={isPositive} />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

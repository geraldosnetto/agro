"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SparklineChartWrapper as SparklineChart } from "./SparklineChartWrapper";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VariationBadge } from "@/components/VariationBadge";

import { CATEGORIA_CONFIG, type CategoriaKey } from '@/lib/categories';

export type CotacaoCategoria = CategoriaKey;

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
    const config = CATEGORIA_CONFIG[categoria] ?? CATEGORIA_CONFIG.outros;

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
                        config.accentClassName
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
                            <Badge variant="outline" className={cn("text-xs", config.badgeClassName)}>
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
                        <VariationBadge value={variacao} />

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

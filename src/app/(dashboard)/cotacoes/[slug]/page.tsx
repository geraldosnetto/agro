import { cache } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatarUnidade, formatarCategoria, formatarMoeda } from "@/lib/formatters";
import { PRACA_NAMES } from "@/lib/commodities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingChartWrapper as TradingChart } from "@/components/dashboard/TradingChartWrapper";
import { ParitySection } from "@/components/cotacoes/ParitySection";
import { CommodityStats } from "@/components/dashboard/CommodityStats";
import { PredictionCard } from "@/components/ai/PredictionCard";
import { SentimentWidget } from "@/components/ai/SentimentWidget";
import { InternationalPriceCard } from "@/components/cotacoes/InternationalPriceCard";
import { ChevronLeft, Bell } from "lucide-react";
import { getCategoriaConfig } from '@/lib/categories';
import { FavoriteButton } from "@/components/FavoriteButton";
import { ExportButton } from "@/components/ExportButton";
import { ShareButton } from "@/components/ShareButton";
import { VariationBadge } from "@/components/VariationBadge";
import { NewsFeed } from "@/components/dashboard/NewsFeed";

export const dynamic = 'force-dynamic';

interface CommodityPageProps {
    params: Promise<{ slug: string }>;
}

// Deduplicated query — React cache() automatically memoizes within a request lifecycle
const getCommodity = cache(async (slug: string) => {
    return prisma.commodity.findUnique({
        where: { slug },
        include: {
            cotacoes: {
                orderBy: { dataReferencia: 'desc' },
                take: 30
            }
        }
    });
});

// Generate metadata for SEO
export async function generateMetadata({ params }: CommodityPageProps): Promise<Metadata> {
    const { slug } = await params;
    const commodity = await getCommodity(slug);

    if (!commodity) {
        return {
            title: 'Commodity não encontrada | IndicAgro'
        };
    }

    const preferredPracas = PRACA_NAMES[commodity.slug] || [];
    const ultimaCotacao = commodity.cotacoes.find(c => c.praca && preferredPracas.includes(c.praca))
        || commodity.cotacoes[0];

    const valor = ultimaCotacao?.valor?.toNumber() ?? 0;
    const unidade = formatarUnidade(commodity.unidade);

    return {
        title: `${commodity.nome} - R$ ${valor.toFixed(2)}/${unidade} | IndicAgro`,
        description: `Acompanhe a cotação de ${commodity.nome} em tempo real. ${commodity.descricao}. Preço atual: R$ ${valor.toFixed(2)} por ${unidade}.`,
        openGraph: {
            title: `${commodity.nome} - Cotação Atual | IndicAgro`,
            description: `R$ ${valor.toFixed(2)}/${unidade} - Acompanhe preços e tendências de ${commodity.nome}`,
        }
    };
}

export default async function CommodityPage({ params }: CommodityPageProps) {
    const { slug } = await params;

    // Uses cached query — same result as generateMetadata, no duplicate DB call
    const commodity = await getCommodity(slug);

    if (!commodity) {
        notFound();
    }

    const preferredPracas = PRACA_NAMES[commodity.slug] || [];
    const ultimaCotacao = commodity.cotacoes.find(c => c.praca && preferredPracas.includes(c.praca))
        || commodity.cotacoes[0];

    const valor = ultimaCotacao?.valor?.toNumber() ?? 0;
    const valorAnterior = ultimaCotacao?.valorAnterior?.toNumber() ?? 0;
    const variacaoDia = ultimaCotacao?.variacao?.toNumber() ??
        (valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : 0);

    // Calculate week and month variations
    const cotacoes7dias = commodity.cotacoes.slice(0, 7);
    const cotacoes30dias = commodity.cotacoes;

    const valor7diasAtras = cotacoes7dias[cotacoes7dias.length - 1]?.valor?.toNumber() ?? valor;
    const valor30diasAtras = cotacoes30dias[cotacoes30dias.length - 1]?.valor?.toNumber() ?? valor;

    const variacaoSemana = valor7diasAtras > 0
        ? ((valor - valor7diasAtras) / valor7diasAtras) * 100
        : 0;
    const variacaoMes = valor30diasAtras > 0
        ? ((valor - valor30diasAtras) / valor30diasAtras) * 100
        : 0;

    const unidade = formatarUnidade(commodity.unidade);
    const categoria = formatarCategoria(commodity.categoria);
    const dataAtualizacao = ultimaCotacao?.dataReferencia
        ? new Date(ultimaCotacao.dataReferencia).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'N/A';

    // Category colors
    const categoriaConfig = getCategoriaConfig(categoria);

    return (
        <div className="container px-4 py-6 md:py-8 max-w-6xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/cotacoes" className="hover:text-foreground flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    Cotações
                </Link>
                <span>/</span>
                <span className="text-foreground">{commodity.nome}</span>
            </nav>

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
                <div className="space-y-4">
                    {/* Title and Category */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-4xl font-bold">{commodity.nome}</h1>
                        <Badge variant="outline" className={categoriaConfig.badgeClassName}>
                            {categoriaConfig.label}
                        </Badge>
                    </div>

                    {/* Current Price */}
                    <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-bold tracking-tight">
                                {formatarMoeda(valor)}
                            </span>
                            <span className="text-xl text-muted-foreground">/{unidade}</span>
                        </div>

                        {/* Variations */}
                        <div className="flex flex-wrap items-center gap-3">
                            <VariationBadge label="Hoje" value={variacaoDia} />
                            <VariationBadge label="Semana" value={variacaoSemana} />
                            <VariationBadge label="Mês" value={variacaoMes} />
                        </div>
                    </div>

                    {/* Last Update */}
                    <p className="text-sm text-muted-foreground">
                        Última atualização: {dataAtualizacao}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <FavoriteButton commoditySlug={slug} variant="button" size="sm" />
                    <Link href={`/alertas/novo?commodity=${slug}`}>
                        <Button variant="outline" size="sm">
                            <Bell className="h-4 w-4 mr-2" />
                            Criar Alerta
                        </Button>
                    </Link>
                    <ExportButton commoditySlug={slug} size="sm" />
                    <ShareButton
                        title={`${commodity.nome} — IndicAgro`}
                        text={`${commodity.nome}: R$ ${valor.toFixed(2)} (${variacaoDia >= 0 ? '+' : ''}${variacaoDia.toFixed(2)}%)`}
                        size="sm"
                    />
                </div>
            </div>

            {/* Chart Section with Technical Indicators */}
            <div className="mb-8">
                <TradingChart
                    commoditySlug={slug}
                    commodityName={commodity.nome}
                />
            </div>

            {/* Parity Calculator (Only for Soybeans) */}
            <ParitySection
                slug={slug}
                currentPrice={valor}
                state="MT"
            />

            {/* Statistics and AI Section - Grid 2x2 */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Linha 1: Estatísticas + Cotação Internacional */}
                <CommodityStats slug={slug} layout="grid" />
                <InternationalPriceCard
                    slug={slug}
                    cepeaPrice={valor}
                    cepeaUnit={unidade}
                />

                {/* Linha 2: Previsão IA + Sentimento */}
                <PredictionCard slug={slug} />
                <SentimentWidget
                    commoditySlug={slug}
                    commodityName={commodity.nome}
                />
            </div>

            {/* News Section */}
            <NewsFeed slug={slug} commodityName={commodity.nome} limit={5} />

            {/* Product Info */}
            <Card className="mt-10">
                <CardHeader>
                    <CardTitle className="text-lg">Sobre {commodity.nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        {commodity.descricao || `Indicador de preço para ${commodity.nome}.`}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div>
                            <p className="text-sm text-muted-foreground">Unidade</p>
                            <p className="font-medium">{unidade}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Categoria</p>
                            <p className="font-medium">{categoriaConfig.label}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Fonte</p>
                            <p className="font-medium">CEPEA/ESALQ</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Praça</p>
                            <p className="font-medium">{ultimaCotacao?.praca || 'Nacional'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                    Dados de referência. Fonte: CEPEA/ESALQ.
                    <br />
                    Preços podem variar conforme praça e condições de mercado.
                </p>
            </div>
        </div>
    );
}


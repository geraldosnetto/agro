import { cache } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatarUnidade, formatarMoeda } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingChartWrapper as TradingChart } from "@/components/dashboard/TradingChartWrapper";
import { ChevronLeft, Bell } from "lucide-react";
import { getCategoriaConfig } from '@/lib/categories';
import { FavoriteButton } from "@/components/FavoriteButton";
import { ExportButton } from "@/components/ExportButton";
import { ShareButton } from "@/components/ShareButton";
import { VariationBadge } from "@/components/VariationBadge";

export const dynamic = 'force-dynamic';

function slugify(text: string) {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

interface CommodityPracaPageProps {
    params: Promise<{ slug: string; praca: string }>;
}

const getCommodityData = cache(async (slug: string, pracaSlug: string) => {
    const commodity = await prisma.commodity.findUnique({
        where: { slug }
    });

    if (!commodity) return null;

    const pracas = await prisma.cotacao.findMany({
        where: { commodityId: commodity.id, NOT: { praca: 'Seed History' } },
        select: { praca: true },
        distinct: ['praca']
    });

    const realPraca = pracas.find(p => p.praca && slugify(p.praca) === pracaSlug)?.praca;

    if (!realPraca) return null;

    const cotacoes = await prisma.cotacao.findMany({
        where: { commodityId: commodity.id, praca: realPraca },
        orderBy: { dataReferencia: 'desc' },
        take: 30
    });

    return { commodity, cotacoes, praca: realPraca };
});

export async function generateMetadata({ params }: CommodityPracaPageProps): Promise<Metadata> {
    const { slug, praca } = await params;
    const data = await getCommodityData(slug, praca);

    if (!data || data.cotacoes.length === 0) {
        return { title: 'Cotação não encontrada | IndicAgro' };
    }

    const { commodity, cotacoes, praca: realPraca } = data;
    const valor = cotacoes[0]?.valor?.toNumber() ?? 0;
    const unidade = formatarUnidade(commodity.unidade);

    return {
        title: `Preço da ${commodity.nome} em ${realPraca} | Cotação Hoje | IndicAgro`,
        description: `Acompanhe a cotação e o preço atualizado da ${commodity.nome} na praça de ${realPraca}. Valor atual: R$ ${valor.toFixed(2)} por ${unidade}. Histórico completo e tendências.`,
        openGraph: {
            title: `${commodity.nome} em ${realPraca} - R$ ${valor.toFixed(2)}`,
            description: `Acompanhe o preço de hoje da ${commodity.nome} em ${realPraca}. Atualizado em tempo real.`,
        }
    };
}

export default async function CommodityPracaPage({ params }: CommodityPracaPageProps) {
    const { slug, praca: pracaSlug } = await params;
    const data = await getCommodityData(slug, pracaSlug);

    if (!data || data.cotacoes.length === 0) {
        notFound();
    }

    const { commodity, cotacoes, praca: realPraca } = data;
    const ultimaCotacao = cotacoes[0];

    const valor = ultimaCotacao.valor.toNumber();
    const valorAnterior = ultimaCotacao.valorAnterior?.toNumber() ?? 0;
    const variacaoDia = ultimaCotacao.variacao?.toNumber() ??
        (valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : 0);

    const cotacoes7dias = cotacoes.slice(0, 7);
    const valor7diasAtras = cotacoes7dias[cotacoes7dias.length - 1]?.valor?.toNumber() ?? valor;
    const variacaoSemana = valor7diasAtras > 0 ? ((valor - valor7diasAtras) / valor7diasAtras) * 100 : 0;

    const unidade = formatarUnidade(commodity.unidade);
    const dataAtualizacao = new Date(ultimaCotacao.dataReferencia).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const categoriaConfig = getCategoriaConfig(commodity.categoria as any);

    return (
        <div className="container px-4 py-6 md:py-8 max-w-6xl">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/cotacoes" className="hover:text-foreground flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" /> Cotações
                </Link>
                <span>/</span>
                <Link href={`/cotacoes/${slug}`} className="hover:text-foreground">{commodity.nome}</Link>
                <span>/</span>
                <span className="text-foreground">{realPraca}</span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-4xl font-bold">{commodity.nome} <span className="text-muted-foreground font-medium text-2xl">| {realPraca}</span></h1>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-bold tracking-tight">
                                {formatarMoeda(valor)}
                            </span>
                            <span className="text-xl text-muted-foreground">/{unidade}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <VariationBadge label="Hoje" value={variacaoDia} />
                            <VariationBadge label="Semana" value={variacaoSemana} />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Última atualização: {dataAtualizacao}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link href={`/alertas/novo?commodity=${slug}`}>
                        <Button variant="outline" size="sm">
                            <Bell className="h-4 w-4 mr-2" />
                            Criar Alerta Regional
                        </Button>
                    </Link>
                    <ShareButton
                        title={`${commodity.nome} em ${realPraca} — IndicAgro`}
                        text={`${commodity.nome} em ${realPraca}: R$ ${valor.toFixed(2)} (${variacaoDia >= 0 ? '+' : ''}${variacaoDia.toFixed(2)}%)`}
                        size="sm"
                    />
                </div>
            </div>

            <div className="mb-8">
                <TradingChart
                    commoditySlug={slug}
                    commodityName={`${commodity.nome} - ${realPraca}`}
                />
            </div>

            <Card className="mt-10">
                <CardHeader>
                    <CardTitle className="text-lg">Sobre a Praça de {realPraca}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Histórico de preços e indicadores voltados para a região de {realPraca}.
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

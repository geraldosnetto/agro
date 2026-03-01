import { Badge } from "@/components/ui/badge";
import { CotacaoCategoria } from "@/components/dashboard/CotacaoCard";
import { CotacoesClientTabs } from "@/components/dashboard/CotacoesClientTabs";
import { fetchDolarPTAX } from "@/lib/data-sources/bcb";
import { PriceChartSelector } from "@/components/dashboard/PriceChartSelector";
import { AnomalyAlert } from "@/components/ai/AnomalyAlert";
import { SentimentSelector } from "@/components/ai/SentimentSelector";
import { formatarUnidade, formatarCategoria } from "@/lib/formatters";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { PRACA_NAMES } from "@/lib/commodities";

// Força renderização dinâmica - evita erro de conexão Prisma durante build
export const dynamic = 'force-dynamic';

export default async function CotacoesPage() {

    // Busca sessão do usuário
    const session = await auth();
    const userId = session?.user?.id;

    // Busca favoritos do usuário (se logado)
    const userFavorites = userId
        ? await prisma.favorito.findMany({
            where: { userId },
            select: { commodityId: true }
        })
        : [];
    const favoriteSlugs = new Set(userFavorites.map(f => f.commodityId));

    // Busca dólar PTAX real do Banco Central
    const dolarData = await fetchDolarPTAX();
    const dolar = dolarData ? {
        compra: dolarData.compra,
        venda: dolarData.venda,
        variacao: dolarData.variacao ?? 0,
        disponivel: true,
    } : {
        compra: 0,
        venda: 0,
        variacao: 0,
        disponivel: false,
    };

    // Busca Commodities do banco
    const commoditiesData = await prisma.commodity.findMany({
        where: { ativo: true },
        include: {
            cotacoes: {
                orderBy: { dataReferencia: 'desc' },
                take: 5
            }
        }
    });

    // Mapeia para o formato de UI
    const cotacoes = commoditiesData.map(c => {
        const preferredPracas = PRACA_NAMES[c.slug] || [];
        const ultima = c.cotacoes.find(q => q.praca && preferredPracas.includes(q.praca))
            || c.cotacoes[0];

        const valor = ultima?.valor?.toNumber() ?? 0;
        const valorAnterior = ultima?.valorAnterior?.toNumber() ?? 0;
        const variacao = ultima?.variacao?.toNumber() ??
            (valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : 0);

        return {
            slug: c.slug,
            nome: c.nome,
            valor: valor,
            unidade: formatarUnidade(c.unidade),
            variacao: variacao,
            categoria: formatarCategoria(c.categoria) as CotacaoCategoria,
            praca: ultima?.praca ?? "N/A",
            // Formatar data: "Hoje, HH:mm" ou DD/MM/YYYY
            dataAtualizacao: ultima?.dataReferencia
                ? new Date(ultima.dataReferencia).toLocaleDateString('pt-BR')
                : new Date(c.updatedAt).toLocaleDateString('pt-BR'),
            isFavorite: favoriteSlugs.has(c.slug),
        };
    });

    // Ordena: favoritos primeiro, depois por nome
    const sortedCotacoes = [...cotacoes].sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.nome.localeCompare(b.nome);
    });

    const graos = sortedCotacoes.filter((c) => c.categoria === "graos");
    const pecuaria = sortedCotacoes.filter((c) => c.categoria === "pecuaria");
    const sucroenergetico = sortedCotacoes.filter((c) => c.categoria === "sucroenergetico");
    const fibras = sortedCotacoes.filter((c) => c.categoria === "fibras");
    const peixe = sortedCotacoes.filter((c) => c.categoria === "peixe");
    const outros = sortedCotacoes.filter((c) => c.categoria === "outros");

    // Calcula timestamp real da última atualização
    const latestDate = commoditiesData.reduce((latest, c) => {
        const d = c.cotacoes[0]?.dataReferencia;
        if (d && (!latest || d > latest)) return d;
        return latest;
    }, null as Date | null);
    const ultimaAtualizacao = latestDate
        ? `Atualizado em ${latestDate.toLocaleDateString('pt-BR')} às ${latestDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : `Atualizado hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    return (
        <div className="container px-4 py-6 md:py-8">
            {/* Header da página */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Cotações</h1>
                    <p className="text-muted-foreground">
                        Preços atualizados de commodities agrícolas
                    </p>
                </div>

                {/* Indicador do Dólar */}
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🇺🇸</span>
                        <div>
                            <p className="text-xs text-muted-foreground">Dólar PTAX</p>
                            <p className="font-semibold">
                                {dolar.disponivel ? `R$ ${dolar.venda.toFixed(2)}` : 'Indisponível'}
                            </p>
                        </div>
                    </div>
                    {dolar.disponivel && (
                        <Badge
                            variant="outline"
                            className={
                                dolar.variacao >= 0
                                    ? "bg-[var(--positive)]/10 text-[var(--positive)] border-[var(--positive)]/20"
                                    : "bg-[var(--negative)]/10 text-[var(--negative)] border-[var(--negative)]/20"
                            }
                        >
                            {dolar.variacao >= 0 ? "+" : ""}
                            {dolar.variacao.toFixed(2)}%
                        </Badge>
                    )}
                </div>
            </div>

            {/* Gráfico com Seletor */}
            <div className="mb-8">
                <PriceChartSelector
                    commodities={commoditiesData.map(c => ({ slug: c.slug, nome: c.nome }))}
                    defaultSlug="soja"
                />
            </div>

            {/* Alertas de Anomalia */}
            <div className="mb-8 grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Alertas de Preço</h3>
                    <AnomalyAlert limit={3} />
                </div>
                <SentimentSelector
                    commodities={commoditiesData.map(c => ({ slug: c.slug, nome: c.nome }))}
                    defaultSlug="soja"
                />
            </div>

            {/* Tabs de categoria e Toggle importado do Client Component */}
            <CotacoesClientTabs
                sortedCotacoes={sortedCotacoes}
                graos={graos}
                pecuaria={pecuaria}
                sucroenergetico={sucroenergetico}
                fibras={fibras}
                peixe={peixe}
                outros={outros}
            />

            {/* Fonte */}
            <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                    Dados de referência. Fontes: CEPEA/ESALQ, CONAB, Banco Central.
                    <br />
                    Última atualização: {ultimaAtualizacao}
                </p>
            </div>
        </div >
    );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CotacaoCard, CotacaoCategoria } from "@/components/dashboard/CotacaoCard";
import { fetchDolarPTAX } from "@/lib/data-sources/bcb";
import { PriceChartSelector } from "@/components/dashboard/PriceChartSelector";
import { AnomalyAlert } from "@/components/ai/AnomalyAlert";
import { formatarUnidade, formatarCategoria } from "@/lib/formatters";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

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
                take: 1
            }
        }
    });

    // Mapeia para o formato de UI
    const cotacoes = commoditiesData.map(c => {
        const ultima = c.cotacoes[0];
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

    return (
        <div className="container px-4 py-6 md:py-8">
            {/* Header da página */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Cotações</h1>
                    <p className="text-muted-foreground mt-1">
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
            <div className="mb-8">
                <AnomalyAlert limit={3} />
            </div>

            {/* Tabs de categoria */}
            <Tabs defaultValue="todos" className="space-y-6">
                <TabsList className="w-full md:w-auto grid grid-cols-4 md:flex">
                    <TabsTrigger value="todos" className="flex-1 md:flex-none">
                        Todos
                        <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                            {sortedCotacoes.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="graos" className="flex-1 md:flex-none">
                        Grãos
                        <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                            {graos.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pecuaria" className="flex-1 md:flex-none">
                        Pecuária
                        <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                            {pecuaria.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="sucroenergetico" className="flex-1 md:flex-none text-xs sm:text-sm">
                        Sucro
                        <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                            {sucroenergetico.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Todos */}
                <TabsContent value="todos" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedCotacoes.map((cotacao) => (
                            <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                        ))}
                    </div>
                </TabsContent>

                {/* Grãos */}
                <TabsContent value="graos" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {graos.map((cotacao) => (
                            <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                        ))}
                    </div>
                </TabsContent>

                {/* Pecuária */}
                <TabsContent value="pecuaria" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pecuaria.map((cotacao) => (
                            <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                        ))}
                    </div>
                </TabsContent>

                {/* Sucroenergetico */}
                <TabsContent value="sucroenergetico" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sucroenergetico.map((cotacao) => (
                            <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Fonte */}
            <div className="mt-8 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                    Dados de referência. Fontes: CEPEA/ESALQ, CONAB, Banco Central.
                    <br />
                    Última atualização: Hoje às 14:30
                </p>
            </div>
        </div >
    );
}

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List } from "lucide-react";
import { CotacaoCard, CotacaoCategoria } from "@/components/dashboard/CotacaoCard";
import { CotacoesTable } from "@/components/dashboard/CotacoesTable";

interface CotacaoItem {
    slug: string;
    nome: string;
    valor: number;
    unidade: string;
    variacao: number;
    categoria: CotacaoCategoria;
    praca: string;
    dataAtualizacao: string;
    isFavorite: boolean;
}

interface CotacoesClientTabsProps {
    sortedCotacoes: CotacaoItem[];
    graos: CotacaoItem[];
    pecuaria: CotacaoItem[];
    sucroenergetico: CotacaoItem[];
    fibras: CotacaoItem[];
    peixe: CotacaoItem[];
    outros: CotacaoItem[];
}

export function CotacoesClientTabs({
    sortedCotacoes,
    graos,
    pecuaria,
    sucroenergetico,
    fibras,
    peixe,
    outros
}: CotacoesClientTabsProps) {
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <Tabs defaultValue="todos" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <TabsList className="w-full md:w-auto flex flex-wrap h-auto gap-1 justify-start">
                        <TabsTrigger value="todos" className="flex-1 md:flex-none whitespace-nowrap">
                            Todos
                            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                                {sortedCotacoes.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="graos" className="flex-1 md:flex-none whitespace-nowrap">
                            Grãos
                            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                                {graos.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pecuaria" className="flex-1 md:flex-none whitespace-nowrap">
                            Pecuária
                            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                                {pecuaria.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="sucroenergetico" className="flex-1 md:flex-none whitespace-nowrap text-xs sm:text-sm">
                            Sucro
                            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                                {sucroenergetico.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="fibras" className="flex-1 md:flex-none whitespace-nowrap text-xs sm:text-sm">
                            Fibras
                            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                                {fibras.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="peixe" className="flex-1 md:flex-none whitespace-nowrap text-xs sm:text-sm">
                            Peixes
                            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                                {peixe.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="outros" className="flex-1 md:flex-none whitespace-nowrap text-xs sm:text-sm">
                            Outros
                            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                                {outros.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 bg-muted p-1 rounded-md self-end">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-sm flex items-center gap-2 transition-colors ${viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/50"}`}
                            title="Visualização em Grade"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded-sm flex items-center gap-2 transition-colors ${viewMode === "table" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/50"}`}
                            title="Visualização em Tabela"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Todos */}
                <TabsContent value="todos" className="mt-6 space-y-6">
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedCotacoes.map((cotacao) => (
                                <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                            ))}
                        </div>
                    ) : (
                        <CotacoesTable data={sortedCotacoes} />
                    )}
                </TabsContent>

                {/* Grãos */}
                <TabsContent value="graos" className="mt-6 space-y-6">
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {graos.map((cotacao) => (
                                <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                            ))}
                        </div>
                    ) : (
                        <CotacoesTable data={graos} />
                    )}
                </TabsContent>

                {/* Pecuária */}
                <TabsContent value="pecuaria" className="mt-6 space-y-6">
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {pecuaria.map((cotacao) => (
                                <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                            ))}
                        </div>
                    ) : (
                        <CotacoesTable data={pecuaria} />
                    )}
                </TabsContent>

                {/* Sucroenergetico */}
                <TabsContent value="sucroenergetico" className="mt-6 space-y-6">
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sucroenergetico.map((cotacao) => (
                                <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                            ))}
                        </div>
                    ) : (
                        <CotacoesTable data={sucroenergetico} />
                    )}
                </TabsContent>

                {/* Fibras */}
                <TabsContent value="fibras" className="mt-6 space-y-6">
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {fibras.map((cotacao) => (
                                <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                            ))}
                        </div>
                    ) : (
                        <CotacoesTable data={fibras} />
                    )}
                </TabsContent>

                {/* Peixe */}
                <TabsContent value="peixe" className="mt-6 space-y-6">
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {peixe.map((cotacao) => (
                                <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                            ))}
                        </div>
                    ) : (
                        <CotacoesTable data={peixe} />
                    )}
                </TabsContent>

                {/* Outros */}
                <TabsContent value="outros" className="mt-6 space-y-6">
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {outros.map((cotacao) => (
                                <CotacaoCard key={`${cotacao.nome}-${cotacao.praca}`} {...cotacao} />
                            ))}
                        </div>
                    ) : (
                        <CotacoesTable data={outros} />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

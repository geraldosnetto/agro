
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BrazilMap from "./BrazilMap";
import { MapSummaryCard } from "./MapSummaryCard";
import { StateRanking, StateTable } from "./StateRanking";
import { Loader2, ChevronDown, ChevronUp, Table } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StateData {
    id: string;
    uf: string;
    value: number;
    variation: number;
    cities: number;
}

export function HeatMapContainer() {
    const [selectedCommodity, setSelectedCommodity] = useState<string>("soja");
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [showTable, setShowTable] = useState(false);
    const [colorMode, setColorMode] = useState<"variation" | "price">("variation");

    const { data, isLoading } = useSWR(`/api/heatmap?commodity=${selectedCommodity}`, fetcher);

    const stateData: StateData[] = data?.data || [];

    const handleStateClick = (uf: string) => {
        setSelectedState(selectedState === uf ? null : uf);
    };

    return (
        <div className="space-y-6">
            {/* Header com filtros */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Mapa de Calor: Preços Estaduais</h2>
                    <p className="text-sm text-muted-foreground">
                        Preço médio e variação nos últimos 7 dias por estado (base CEPEA/Esalq).
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Modo de cor */}
                    <Tabs value={colorMode} onValueChange={(v) => setColorMode(v as "variation" | "price")}>
                        <TabsList className="h-9">
                            <TabsTrigger value="variation" className="text-xs">Variação</TabsTrigger>
                            <TabsTrigger value="price" className="text-xs">Preço</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Seletor de commodity */}
                    <div className="w-[200px]">
                        <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione a commodity" />
                            </SelectTrigger>
                            <SelectContent>
                                {data?.availableCommodities?.map((c: { slug: string; nome: string; unidade: string }) => (
                                    <SelectItem key={c.slug} value={c.slug}>
                                        {c.nome}
                                    </SelectItem>
                                ))}
                                {!data && <SelectItem value="soja">Carregando...</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Layout Principal: Mapa + Sidebar */}
            <div className="grid lg:grid-cols-[1fr_350px] gap-6 items-start">
                {/* Coluna do Mapa */}
                <div className="space-y-4 min-w-0">
                    {isLoading ? (
                        <Card className="w-full h-[500px] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </Card>
                    ) : (
                        <BrazilMap
                            data={stateData}
                            unit={data?.commodity?.unit || ""}
                            colorMode={colorMode}
                            selectedState={selectedState}
                            onStateClick={handleStateClick}
                        />
                    )}

                    {/* Botão para expandir tabela */}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowTable(!showTable)}
                    >
                        <Table className="h-4 w-4 mr-2" />
                        {showTable ? "Ocultar" : "Ver"} Tabela Completa
                        {showTable ? (
                            <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                            <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                    </Button>

                    {/* Tabela Expandida */}
                    {showTable && (
                        <StateTable
                            data={stateData}
                            onStateClick={handleStateClick}
                        />
                    )}
                </div>

                {/* Sidebar: Resumo + Ranking */}
                <div className="space-y-4 lg:sticky lg:top-20 max-h-[calc(100vh-120px)] overflow-y-auto">
                    <MapSummaryCard
                        data={stateData}
                        commodityName={data?.commodity?.name || selectedCommodity}
                        unit={data?.commodity?.unit || ""}
                    />

                    <StateRanking
                        data={stateData}
                        onStateClick={handleStateClick}
                        selectedState={selectedState}
                    />
                </div>
            </div>
        </div>
    );
}

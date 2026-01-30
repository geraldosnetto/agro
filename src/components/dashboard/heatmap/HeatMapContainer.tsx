
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BrazilMap from "./BrazilMap";
import { Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function HeatMapContainer() {
    const [selectedCommodity, setSelectedCommodity] = useState<string>("soja");

    const { data, isLoading } = useSWR(`/api/heatmap?commodity=${selectedCommodity}`, fetcher);

    // Se tiver commodities disponíveis, garantir que a seleção é válida
    // (Opcional, pois o backend defaulta para Soja se vazio)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Mapa de Calor: Preços Estaduais</h2>
                    <p className="text-sm text-muted-foreground">
                        Preço médio e variação nos últimos 7 dias por estado (base CEPEA/Esalq).
                    </p>
                </div>

                <div className="w-full md:w-[250px]">
                    <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a commodity" />
                        </SelectTrigger>
                        <SelectContent>
                            {data?.availableCommodities?.map((c: { slug: string; nome: string; unidade: string }) => (
                                <SelectItem key={c.slug} value={c.slug}>
                                    {c.nome} ({c.unidade})
                                </SelectItem>
                            ))}
                            {!data && <SelectItem value="soja">Carregando...</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="w-full h-[500px] flex items-center justify-center bg-muted/10 border rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <BrazilMap
                    data={data?.data || []}
                    unit={data?.commodity?.unit || ""}
                />
            )}
        </div>
    );
}

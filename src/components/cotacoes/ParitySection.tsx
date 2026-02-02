
"use client";

import useSWR from "swr";
import { ParityCalculator } from "./ParityCalculator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface ParitySectionProps {
    slug: string;
    currentPrice: number;
    state?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Falha ao carregar');
    return res.json();
});

export function ParitySection({ slug, currentPrice, state = "MT" }: ParitySectionProps) {
    // Só renderiza para Soja por enquanto (devido à lógica específica de conversão)
    if (slug !== 'soja') return null;

    const { data, error, isLoading } = useSWR(`/api/cotacoes/paridade?slug=${slug}`, fetcher, {
        revalidateOnFocus: false,
        refreshInterval: 0 // Não precisa ficar atualizando toda hora
    });

    if (isLoading) {
        return (
            <div className="w-full h-[300px] border rounded-lg bg-muted/10 p-6 flex flex-col gap-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 gap-4 h-full">
                    <Skeleton className="h-full w-full" />
                    <Skeleton className="h-full w-full" />
                </div>
            </div>
        );
    }

    if (error || data?.error) {
        // Se der erro (ex: sem internet, API fora), simplesmente não mostra a calculadora
        // para não poluir a UI com erros não críticos.
        return null;
    }

    return (
        <ParityCalculator
            cbotPrice={data.cbotPrice}
            dolarPrice={data.dolarPrice}
            currentPrice={currentPrice}
            state={state}
            className="mb-8"
        />
    );
}

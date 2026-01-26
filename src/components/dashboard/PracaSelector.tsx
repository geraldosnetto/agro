"use client";

import { memo } from "react";
import useSWR from "swr";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface Praca {
    index: number;
    nome: string;
}

interface PracaSelectorProps {
    slug: string;
    selectedPraca: number;
    onPracaChange: (pracaIndex: number) => void;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

export const PracaSelector = memo(function PracaSelector({
    slug,
    selectedPraca,
    onPracaChange,
}: PracaSelectorProps) {
    const { data, isLoading } = useSWR<{ pracas: Praca[] }>(
        `/api/pracas/${slug}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 300000, // 5 min cache
        }
    );

    const pracas = data?.pracas || [];

    // Don't show selector if only 1 praça
    if (!isLoading && pracas.length <= 1) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Select
                value={String(selectedPraca)}
                onValueChange={(val) => onPracaChange(Number(val))}
                disabled={isLoading}
            >
                <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione a praça"} />
                </SelectTrigger>
                <SelectContent>
                    {pracas.map((praca) => (
                        <SelectItem key={praca.index} value={String(praca.index)}>
                            {praca.nome}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
});

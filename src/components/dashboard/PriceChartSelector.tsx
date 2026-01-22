"use client";

import { useState } from "react";
import { PriceChart } from "./PriceChart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CommodityOption {
    slug: string;
    nome: string;
}

interface PriceChartSelectorProps {
    commodities: CommodityOption[];
    defaultSlug?: string;
}

export function PriceChartSelector({ commodities, defaultSlug }: PriceChartSelectorProps) {
    const initialSlug = defaultSlug || commodities[0]?.slug || "soja";
    const [selectedSlug, setSelectedSlug] = useState(initialSlug);

    const selectedCommodity = commodities.find(c => c.slug === selectedSlug) || commodities[0];

    if (commodities.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Selecione uma commodity" />
                    </SelectTrigger>
                    <SelectContent>
                        {commodities.map((commodity) => (
                            <SelectItem key={commodity.slug} value={commodity.slug}>
                                {commodity.nome}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <PriceChart
                commoditySlug={selectedCommodity?.slug}
                commodityName={selectedCommodity?.nome}
            />
        </div>
    );
}

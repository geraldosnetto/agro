"use client";

import { useState } from "react";
import { PriceChart } from "./PriceChart";
import { PracaSelector } from "./PracaSelector";

interface PriceChartWithPracaProps {
    commoditySlug: string;
    commodityName: string;
}

export function PriceChartWithPraca({ commoditySlug, commodityName }: PriceChartWithPracaProps) {
    const [selectedPraca, setSelectedPraca] = useState(0);

    return (
        <div className="space-y-4">
            {/* Praça Selector - only shows if commodity has multiple praças */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Histórico de Preços</h2>
                <PracaSelector
                    slug={commoditySlug}
                    selectedPraca={selectedPraca}
                    onPracaChange={setSelectedPraca}
                />
            </div>

            {/* Price Chart with selected praça */}
            <PriceChart
                commoditySlug={commoditySlug}
                commodityName={commodityName}
                praca={selectedPraca}
            />
        </div>
    );
}

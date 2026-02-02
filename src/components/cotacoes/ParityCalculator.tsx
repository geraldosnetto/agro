
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowRight, Truck, DollarSign, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

// Dados estimados de frete e custos (Base: Jan/2026)
// R$/tonelada, convertidos para R$/saca 60kg
const ESTIMATED_FREIGHT: Record<string, number> = {
    'MT': 28.50, // ~R$ 475/ton 
    'PR': 11.00, // ~R$ 180/ton
    'GO': 22.00, // ~R$ 360/ton
    'MS': 19.50, // ~R$ 320/ton
    'RS': 12.00, // ~R$ 200/ton
    'BA': 24.00, // ~R$ 400/ton
    'MG': 18.00, // ~R$ 300/ton
    'SP': 9.00,  // ~R$ 150/ton
    'SC': 14.00, // ~R$ 230/ton
    'TO': 27.00, // ~R$ 450/ton
    'MA': 25.00, // ~R$ 415/ton
    'PI': 26.00, // ~R$ 430/ton
};

// Custos portuários estimados (FOB) em USD/bu -> USD/ton -> R$/saca
const PORT_COSTS_BRL_SACA = 3.50;

interface ParityCalculatorProps {
    cbotPrice: number; // Preço em Centavos/bushel (ex: 1060.00)
    dolarPrice: number; // Cotação USD/BRL (ex: 5.80)
    currentPrice: number; // Preço físico local em R$/saca
    state: string; // Estado selecionado (sigla)
    className?: string;
}

export function ParityCalculator({
    cbotPrice,
    dolarPrice,
    currentPrice,
    state,
    className
}: ParityCalculatorProps) {
    // Estados internos para permitir edição
    const [freightCost, setFreightCost] = useState<number>(0);
    const [portPremium, setPortPremium] = useState<number>(1.50); // USD/bushel prêmio
    const [selectedState, setSelectedState] = useState<string>(state);

    useEffect(() => {
        // Atualiza frete quando estado muda
        const freight = ESTIMATED_FREIGHT[selectedState] || 20.00;
        setFreightCost(freight);
    }, [selectedState]);

    useEffect(() => {
        if (state) setSelectedState(state);
    }, [state]);

    // Cálculos
    // 1. Converter CBOT (cents/bu) para USD/bu
    const cbotUsd = cbotPrice / 100;

    // 2. Adicionar prêmio exportação (USD/bu)
    const fobPortoUsd = cbotUsd + portPremium;

    // 3. Converter para R$/Saca 60kg
    // Fator conversão: 1 bushel soja = 27.2155 kg
    // 1 saca = 60kg = 2.20462 bushels
    const pricePortoBrl = fobPortoUsd * 2.20462 * dolarPrice;

    // 4. Subtrair custos logística (Porto -> Interior)
    const parityInterior = pricePortoBrl - freightCost - PORT_COSTS_BRL_SACA;

    // 5. Comparar com Mercado Físico
    const spread = currentPrice - parityInterior;
    const spreadPercent = (spread / parityInterior) * 100;

    const isInternalBetter = spread > 0;

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-3 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Calculadora de Paridade de Exportação
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                    {/* Coluna Esquerda: Inputs */}
                    <div className="p-4 space-y-4 border-r border-border/50">
                        <div className="space-y-2">
                            <Label>Estado de Origem</Label>
                            <Select
                                value={selectedState}
                                onValueChange={setSelectedState}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(ESTIMATED_FREIGHT).map(uf => (
                                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Dólar (R$)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        value={dolarPrice.toFixed(2)}
                                        disabled
                                        className="pl-6 bg-muted/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>CBOT (US¢/bu)</Label>
                                <Input
                                    type="number"
                                    value={cbotPrice.toFixed(2)}
                                    disabled
                                    className="bg-muted/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex justify-between">
                                <span>Frete até Porto (R$/sc)</span>
                                <span className="text-xs text-muted-foreground font-normal">Editável</span>
                            </Label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    step="0.10"
                                    value={freightCost}
                                    onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex justify-between">
                                <span>Prêmio Porto (USD/bu)</span>
                                <span className="text-xs text-muted-foreground font-normal">Editável</span>
                            </Label>
                            <div className="relative">
                                <Anchor className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    step="0.10"
                                    value={portPremium}
                                    onChange={(e) => setPortPremium(parseFloat(e.target.value) || 0)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita: Resultados */}
                    <div className="p-4 bg-muted/10 space-y-5">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Cálculo da Paridade
                            </h4>

                            <div className="flex justify-between items-center text-sm">
                                <span>Preço FOB Porto</span>
                                <span className="font-semibold">R$ {pricePortoBrl.toFixed(2)}/sc</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-red-500">
                                <span>(-) Custos Logística</span>
                                <span>- R$ {(freightCost + PORT_COSTS_BRL_SACA).toFixed(2)}/sc</span>
                            </div>

                            <div className="pt-2 border-t flex justify-between items-end">
                                <span className="font-medium">Paridade Interior</span>
                                <span className="text-xl font-bold text-primary">
                                    R$ {parityInterior.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border bg-background shadow-sm space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Mercado Físico ({selectedState})</span>
                                <span className="font-semibold">R$ {currentPrice.toFixed(2)}</span>
                            </div>

                            <div className={cn(
                                "flex items-center justify-between p-2 rounded text-sm font-medium",
                                isInternalBetter
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                                <span className="flex items-center gap-1">
                                    {isInternalBetter ? "Vender Internamente" : "Oportunidade Exportação"}
                                </span>
                                <span>
                                    {spread > 0 ? "+" : ""}{spread.toFixed(2)} /sc ({spreadPercent.toFixed(1)}%)
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            * Valores estimados. Custos portuários e fretes podem variar.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

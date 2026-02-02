"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CommodityOption {
    id: string;
    name: string;
    slug: string;
    category: string;
}

interface ComparatorControlsProps {
    commodities: CommodityOption[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    days: string;
    onDaysChange: (days: string) => void;
    normalized: boolean;
    onNormalizedChange: (normalized: boolean) => void;
}

const PRESETS = [
    { label: "Soja x Milho", slugs: ["soja", "milho"] },
    { label: "Boi x Bezerro", slugs: ["boi-gordo", "bezerro"] },
    { label: "Etanol x Açúcar", slugs: ["etanol-hidratado", "acucar"] },
];

export function ComparatorControls({
    commodities,
    selectedIds,
    onSelectionChange,
    days,
    onDaysChange,
    normalized,
    onNormalizedChange,
}: ComparatorControlsProps) {
    const [open, setOpen] = React.useState(false);

    const toggleCommodity = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((item) => item !== id));
        } else {
            if (selectedIds.length >= 5) {
                // Limit max selection if needed
                return;
            }
            onSelectionChange([...selectedIds, id]);
        }
    };

    const applyPreset = (slugs: string[]) => {
        const ids = slugs
            .map(s => commodities.find(c => c.slug.includes(s))?.id)
            .filter((id): id is string => !!id);

        if (ids.length > 0) {
            onSelectionChange(ids);
            // Auto habilitar normalização se forem de categorias muito diferentes (opcional logic)
        }
    };

    const selectedCommodities = commodities.filter((c) =>
        selectedIds.includes(c.id)
    );

    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
                    {/* Multi-select */}
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Label>Commodities</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between md:w-[280px]"
                                >
                                    {selectedIds.length > 0
                                        ? `${selectedIds.length} selecionado(s)`
                                        : "Selecione..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar commodity..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhuma commodity encontrada.</CommandEmpty>
                                        <CommandGroup>
                                            {commodities.map((commodity) => (
                                                <CommandItem
                                                    key={commodity.id}
                                                    value={`${commodity.name}-${commodity.id}`}
                                                    onSelect={() => toggleCommodity(commodity.id)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedIds.includes(commodity.id)
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {commodity.name}
                                                    <span className="ml-auto text-xs text-muted-foreground uppercase opacity-50">
                                                        {commodity.category.substring(0, 3)}
                                                    </span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Date Range */}
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Label>Período</Label>
                        <Select value={days} onValueChange={onDaysChange}>
                            <SelectTrigger className="w-full md:w-[140px]">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 dias</SelectItem>
                                <SelectItem value="30">30 dias</SelectItem>
                                <SelectItem value="90">90 dias</SelectItem>
                                <SelectItem value="180">6 meses</SelectItem>
                                <SelectItem value="365">1 ano</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Normalization Toggle */}
                    <div className="flex flex-col gap-2 pb-1">
                        <Label className="cursor-pointer text-xs mb-1" htmlFor="norm-switch">Modo Comparativo (%)</Label>
                        <div className="flex items-center space-x-2">
                            <Switch id="norm-switch" checked={normalized} onCheckedChange={onNormalizedChange} />
                            <span className="text-sm text-muted-foreground">
                                {normalized ? "Ativado" : "Desativado"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Presets */}
                <div className="flex flex-col gap-2 w-full lg:w-auto border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Comparações Rápidas
                    </Label>
                    <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                        {PRESETS.map(preset => (
                            <Button
                                key={preset.label}
                                variant="secondary"
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap"
                                onClick={() => applyPreset(preset.slugs)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selected Badges */}
            {selectedCommodities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {selectedCommodities.map(c => (
                        <Badge key={c.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1 text-sm font-normal">
                            {c.name}
                            <div
                                className="ml-1 rounded-full p-0.5 hover:bg-muted cursor-pointer transition-colors"
                                onClick={() => toggleCommodity(c.id)}
                            >
                                <X className="h-3 w-3" />
                            </div>
                        </Badge>
                    ))}
                    {selectedCommodities.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => onSelectionChange([])}
                        >
                            Limpar tudo
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

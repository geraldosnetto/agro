"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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

    const selectedCommodities = commodities.filter((c) =>
        selectedIds.includes(c.id)
    );

    return (
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
                {/* Multi-select */}
                <div className="flex flex-col gap-2">
                    <Label>Commodities</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between md:w-[300px]"
                            >
                                {selectedIds.length > 0
                                    ? `${selectedIds.length} selecionado(s)`
                                    : "Selecione..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar commodity..." />
                                <CommandList>
                                    <CommandEmpty>Nenhuma commodity encontrada.</CommandEmpty>
                                    <CommandGroup>
                                        {commodities.map((commodity) => (
                                            <CommandItem
                                                key={commodity.id}
                                                value={`${commodity.name}-${commodity.id}`} // Ensure uniqueness for search
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
                                                <span className="ml-auto text-xs text-muted-foreground uppercase">
                                                    {commodity.category}
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
                <div className="flex flex-col gap-2">
                    <Label>Período</Label>
                    <Select value={days} onValueChange={onDaysChange}>
                        <SelectTrigger className="w-full md:w-[150px]">
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
                <div className="flex flex-col gap-2">
                    <Label className="cursor-pointer" htmlFor="norm-switch">Comparar Variação (%)</Label>
                    <div className="flex items-center space-x-2 h-10">
                        <Switch id="norm-switch" checked={normalized} onCheckedChange={onNormalizedChange} />
                        <span className="text-sm text-muted-foreground">
                            {normalized ? "Ativado" : "Desativado"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Selected Badges (Desktop) */}
            {selectedCommodities.length > 0 && (
                <div className="hidden flex-wrap justify-end gap-2 md:flex max-w-[300px]">
                    {selectedCommodities.map(c => (
                        <Badge key={c.id} variant="secondary" className="cursor-pointer" onClick={() => toggleCommodity(c.id)}>
                            {c.name}
                            <X className="ml-1 h-3 w-3" />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

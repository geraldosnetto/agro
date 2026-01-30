
'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { type City, AGRICULTURAL_CITIES } from '@/lib/data-sources/weather';

interface CitySearchProps {
    value?: City;
    onSelect: (city: City) => void;
    className?: string;
}

export function CitySearch({ value, onSelect, className }: CitySearchProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<City[]>(AGRICULTURAL_CITIES);
    const [loading, setLoading] = React.useState(false);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 3) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    if (data.success && data.results.length > 0) {
                        setResults(data.results);
                    } else {
                        // Se não achar nada, mantém os defaults ou limpa
                        if (query.length > 0) setResults([]);
                        else setResults(AGRICULTURAL_CITIES);
                    }
                } catch (error) {
                    console.error('Erro na busca:', error);
                } finally {
                    setLoading(false);
                }
            } else if (query.trim().length === 0) {
                setResults(AGRICULTURAL_CITIES);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    {value ? (
                        <span className="flex items-center truncate">
                            <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            {value.name} - {value.state}
                        </span>
                    ) : (
                        "Selecione uma cidade..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar cidade..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && <CommandEmpty>Buscando...</CommandEmpty>}
                        {!loading && results.length === 0 && (
                            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                        )}
                        <CommandGroup heading={query.length < 3 ? "Principais Regiões" : "Resultados"}>
                            {results.map((city) => (
                                <CommandItem
                                    key={city.id}
                                    value={city.name} // Importante para acessibilidade
                                    onSelect={() => {
                                        onSelect(city);
                                        setOpen(false);
                                        // Reset query optionally
                                        // setQuery(''); 
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value?.id === city.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{city.name}</span>
                                        <span className="text-xs text-muted-foreground">{city.state}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

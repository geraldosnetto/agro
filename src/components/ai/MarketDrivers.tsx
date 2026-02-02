'use client';

import {
    getDriverColor,
    getDriverLabel,
    type MarketDriver,
} from '@/lib/ai/prompts/sentiment';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Cloud,
    TrendingUp,
    Package,
    Landmark,
    DollarSign,
    Truck,
    Bug,
    Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketDriversProps {
    drivers: MarketDriver[];
    showLabels?: boolean;
    maxVisible?: number;
    className?: string;
}

const driverIcons: Record<MarketDriver, React.ReactNode> = {
    CLIMA: <Cloud className="h-3 w-3" />,
    DEMANDA: <TrendingUp className="h-3 w-3" />,
    OFERTA: <Package className="h-3 w-3" />,
    POLITICA: <Landmark className="h-3 w-3" />,
    CAMBIO: <DollarSign className="h-3 w-3" />,
    LOGISTICA: <Truck className="h-3 w-3" />,
    PRAGA: <Bug className="h-3 w-3" />,
    TECNOLOGIA: <Cpu className="h-3 w-3" />,
};

const driverDescriptions: Record<MarketDriver, string> = {
    CLIMA: 'Eventos climáticos como seca, geada ou chuva excessiva',
    DEMANDA: 'Mudanças na demanda de exportação ou consumo interno',
    OFERTA: 'Fatores de oferta como safra, estoques ou produção',
    POLITICA: 'Políticas governamentais, tarifas ou acordos comerciais',
    CAMBIO: 'Variações do dólar e impacto nos preços',
    LOGISTICA: 'Questões de transporte, armazenamento ou portos',
    PRAGA: 'Pragas, doenças ou problemas fitossanitários',
    TECNOLOGIA: 'Inovações agrícolas, biotecnologia ou novos produtos',
};

export function MarketDrivers({
    drivers,
    showLabels = true,
    maxVisible = 5,
    className,
}: MarketDriversProps) {
    if (!drivers || drivers.length === 0) {
        return null;
    }

    const visibleDrivers = drivers.slice(0, maxVisible);
    const hiddenCount = drivers.length - maxVisible;

    return (
        <div className={cn('flex flex-wrap gap-1.5', className)}>
            {visibleDrivers.map((driver) => (
                <DriverBadge key={driver} driver={driver} showLabel={showLabels} />
            ))}
            {hiddenCount > 0 && (
                <Badge variant="outline" className="text-xs">
                    +{hiddenCount}
                </Badge>
            )}
        </div>
    );
}

interface DriverBadgeProps {
    driver: MarketDriver;
    showLabel?: boolean;
    className?: string;
}

export function DriverBadge({
    driver,
    showLabel = true,
    className,
}: DriverBadgeProps) {
    const icon = driverIcons[driver];
    const label = getDriverLabel(driver);
    const color = getDriverColor(driver);
    const description = driverDescriptions[driver];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-xs font-normal cursor-help',
                            color,
                            className
                        )}
                    >
                        {icon}
                        {showLabel && <span className="ml-1">{label}</span>}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// Componente para mostrar estatísticas de drivers
interface DriverStatsProps {
    drivers: MarketDriver[];
    className?: string;
}

export function DriverStats({ drivers, className }: DriverStatsProps) {
    if (!drivers || drivers.length === 0) {
        return null;
    }

    // Contar ocorrências
    const counts = drivers.reduce((acc, d) => {
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const total = drivers.length;

    return (
        <div className={cn('space-y-2', className)}>
            {sorted.map(([driver, count]) => {
                const percentage = Math.round((count / total) * 100);
                const d = driver as MarketDriver;
                return (
                    <div key={driver} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 w-24 text-xs">
                            {driverIcons[d]}
                            <span className="truncate">{getDriverLabel(d)}</span>
                        </div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all',
                                    d === 'CLIMA' && 'bg-sky-500',
                                    d === 'DEMANDA' && 'bg-green-500',
                                    d === 'OFERTA' && 'bg-orange-500',
                                    d === 'POLITICA' && 'bg-purple-500',
                                    d === 'CAMBIO' && 'bg-yellow-500',
                                    d === 'LOGISTICA' && 'bg-blue-500',
                                    d === 'PRAGA' && 'bg-red-500',
                                    d === 'TECNOLOGIA' && 'bg-cyan-500'
                                )}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                            {percentage}%
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { SentimentWidget } from './SentimentWidget';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CommodityOption {
  slug: string;
  nome: string;
}

interface SentimentSelectorProps {
  commodities: CommodityOption[];
  defaultSlug?: string;
  className?: string;
}

export function SentimentSelector({
  commodities,
  defaultSlug = 'soja',
  className
}: SentimentSelectorProps) {
  const [selectedSlug, setSelectedSlug] = useState(defaultSlug);

  const selectedCommodity = commodities.find(c => c.slug === selectedSlug)
    || commodities[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Termômetro do Mercado</h3>
        <Select value={selectedSlug} onValueChange={setSelectedSlug}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {commodities.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SentimentWidget
        commoditySlug={selectedSlug}
        commodityName={selectedCommodity?.nome || ''}
        className={className}
      />
    </div>
  );
}

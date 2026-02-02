/**
 * Yahoo Finance Data Source
 *
 * Fetches international commodity prices from Yahoo Finance.
 * Data has 15-20 minute delay (not real-time).
 */

import { cache } from 'react';

export interface InternationalPrice {
    slug: string;
    ticker: string;
    name: string;
    exchange: string;
    price: number;
    currency: string;
    change: number;
    changePercent: number;
    previousClose: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
    lastUpdated: Date;
}

export interface YahooQuoteResponse {
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketPreviousClose: number;
    regularMarketOpen: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
    regularMarketTime: number;
    shortName: string;
    currency: string;
}

// Mapeamento de commodities brasileiras para tickers internacionais
export const INTERNATIONAL_TICKERS: Record<string, {
    ticker: string;
    name: string;
    exchange: string;
    unit: string;
}> = {
    'soja': {
        ticker: 'ZS=F',
        name: 'Soybean Futures',
        exchange: 'CBOT',
        unit: 'cents/bushel',
    },
    'milho': {
        ticker: 'ZC=F',
        name: 'Corn Futures',
        exchange: 'CBOT',
        unit: 'cents/bushel',
    },
    'trigo': {
        ticker: 'ZW=F',
        name: 'Wheat Futures',
        exchange: 'CBOT',
        unit: 'cents/bushel',
    },
    'cafe-arabica': {
        ticker: 'KC=F',
        name: 'Coffee C Futures',
        exchange: 'ICE',
        unit: 'cents/lb',
    },
    'cafe-robusta': {
        ticker: 'RC=F',
        name: 'Robusta Coffee Futures',
        exchange: 'ICE',
        unit: 'USD/ton',
    },
    'boi-gordo': {
        ticker: 'LE=F',
        name: 'Live Cattle Futures',
        exchange: 'CME',
        unit: 'cents/lb',
    },
    'bezerro': {
        ticker: 'GF=F',
        name: 'Feeder Cattle Futures',
        exchange: 'CME',
        unit: 'cents/lb',
    },
    'suino': {
        ticker: 'HE=F',
        name: 'Lean Hogs Futures',
        exchange: 'CME',
        unit: 'cents/lb',
    },
    'acucar-cristal': {
        ticker: 'SB=F',
        name: 'Sugar #11 Futures',
        exchange: 'ICE',
        unit: 'cents/lb',
    },
    'algodao': {
        ticker: 'CT=F',
        name: 'Cotton #2 Futures',
        exchange: 'ICE',
        unit: 'cents/lb',
    },
    'arroz': {
        ticker: 'ZR=F',
        name: 'Rough Rice Futures',
        exchange: 'CBOT',
        unit: 'USD/cwt',
    },
    'leite': {
        ticker: 'DC=F',
        name: 'Class III Milk Futures',
        exchange: 'CME',
        unit: 'USD/cwt',
    },
};

// Cache simples em memória (15 minutos)
const priceCache = new Map<string, { data: InternationalPrice; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

/**
 * Busca cotação de um ticker específico no Yahoo Finance
 */
async function fetchYahooQuote(ticker: string): Promise<YahooQuoteResponse | null> {
    try {
        // Yahoo Finance API v8 (gratuita, não oficial)
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            next: { revalidate: 900 }, // 15 minutos
        });

        if (!response.ok) {
            console.error(`Yahoo Finance error for ${ticker}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result) {
            console.error(`No data for ticker ${ticker}`);
            return null;
        }

        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];

        return {
            regularMarketPrice: meta.regularMarketPrice || 0,
            regularMarketChange: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
            regularMarketChangePercent: meta.previousClose
                ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
                : 0,
            regularMarketPreviousClose: meta.previousClose || 0,
            regularMarketOpen: quote?.open?.[0] || meta.regularMarketPrice || 0,
            regularMarketDayHigh: quote?.high?.[0] || meta.regularMarketPrice || 0,
            regularMarketDayLow: quote?.low?.[0] || meta.regularMarketPrice || 0,
            regularMarketVolume: quote?.volume?.[0] || 0,
            regularMarketTime: meta.regularMarketTime || Date.now() / 1000,
            shortName: meta.shortName || ticker,
            currency: meta.currency || 'USD',
        };
    } catch (error) {
        console.error(`Error fetching Yahoo quote for ${ticker}:`, error);
        return null;
    }
}

/**
 * Busca preço internacional de uma commodity pelo slug
 */
export async function fetchInternationalPrice(slug: string): Promise<InternationalPrice | null> {
    const mapping = INTERNATIONAL_TICKERS[slug];
    if (!mapping) {
        return null; // Commodity não tem equivalente internacional
    }

    // Verificar cache
    const cached = priceCache.get(slug);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    const quote = await fetchYahooQuote(mapping.ticker);
    if (!quote) {
        return null;
    }

    const price: InternationalPrice = {
        slug,
        ticker: mapping.ticker,
        name: mapping.name,
        exchange: mapping.exchange,
        price: quote.regularMarketPrice,
        currency: quote.currency,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        lastUpdated: new Date(quote.regularMarketTime * 1000),
    };

    // Atualizar cache
    priceCache.set(slug, { data: price, timestamp: Date.now() });

    return price;
}

/**
 * Busca preços internacionais de todas as commodities disponíveis
 */
export const fetchAllInternationalPrices = cache(async (): Promise<InternationalPrice[]> => {
    const slugs = Object.keys(INTERNATIONAL_TICKERS);
    const results: InternationalPrice[] = [];

    // Buscar em paralelo com limite de concorrência
    const batchSize = 4;
    for (let i = 0; i < slugs.length; i += batchSize) {
        const batch = slugs.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(slug => fetchInternationalPrice(slug))
        );
        results.push(...batchResults.filter((r): r is InternationalPrice => r !== null));

        // Pequeno delay entre batches para evitar rate limiting
        if (i + batchSize < slugs.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return results;
});

/**
 * Verifica se uma commodity tem cotação internacional disponível
 */
export function hasInternationalPrice(slug: string): boolean {
    return slug in INTERNATIONAL_TICKERS;
}

/**
 * Retorna informações do ticker internacional para uma commodity
 */
export function getInternationalTickerInfo(slug: string) {
    return INTERNATIONAL_TICKERS[slug] || null;
}

/**
 * Limpa o cache de preços
 */
export function clearPriceCache(): void {
    priceCache.clear();
}

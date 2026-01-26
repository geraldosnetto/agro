/**
 * Agregador de Notícias RSS
 * 
 * Busca notícias de fontes públicas de RSS e filtra por commodity.
 * Abordagem 100% legal: apenas títulos e links, com atribuição de fonte.
 */

import Parser from 'rss-parser';

// Tipos para as notícias
export interface NewsItem {
    title: string;
    link: string;
    source: string;
    sourceUrl: string;
    pubDate: string;
    timeAgo: string;
}

// Fontes RSS públicas
const RSS_SOURCES = [
    {
        name: 'Canal Rural',
        url: 'https://www.canalrural.com.br/feed/',
        baseUrl: 'https://www.canalrural.com.br'
    },
    {
        name: 'Agrolink',
        url: 'https://www.agrolink.com.br/rss/',
        baseUrl: 'https://www.agrolink.com.br'
    },
];

// Keywords por commodity para filtrar notícias relevantes
const COMMODITY_KEYWORDS: Record<string, string[]> = {
    'soja': ['soja', 'soybean', 'soy', 'oleaginosa'],
    'milho': ['milho', 'corn', 'maize', 'cereal'],
    'boi-gordo': ['boi', 'gordo', 'cattle', 'pecuária', 'carne', 'bovina', 'arroba'],
    'cafe': ['café', 'coffee', 'arábica', 'robusta', 'conilon'],
    'acucar': ['açúcar', 'sugar', 'cana', 'sucroalcooleiro'],
    'etanol': ['etanol', 'ethanol', 'álcool', 'biocombustível', 'usina'],
    'etanol-hidratado': ['etanol', 'hidratado', 'álcool', 'biocombustível'],
    'etanol-anidro': ['etanol', 'anidro', 'álcool', 'biocombustível'],
    'trigo': ['trigo', 'wheat', 'farinha'],
    'algodao': ['algodão', 'cotton', 'pluma', 'fibra'],
    'arroz': ['arroz', 'rice'],
    'feijao': ['feijão', 'beans', 'leguminosa'],
    'suino': ['suíno', 'porco', 'pork', 'swine'],
    'frango': ['frango', 'aves', 'chicken', 'avicultura'],
    'leite': ['leite', 'milk', 'laticínio', 'dairy'],
    'mandioca': ['mandioca', 'cassava', 'fécula'],
};

// Cache em memória simples (1 hora)
const cache: Map<string, { data: NewsItem[]; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

/**
 * Calcula tempo relativo (ex: "Há 2 horas")
 */
function getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
        return `Há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays === 1) {
        return 'Ontem';
    } else if (diffDays < 7) {
        return `Há ${diffDays} dias`;
    } else {
        return date.toLocaleDateString('pt-BR');
    }
}

/**
 * Busca notícias de uma fonte RSS específica
 */
async function fetchFromSource(source: typeof RSS_SOURCES[0]): Promise<NewsItem[]> {
    const parser = new Parser({
        timeout: 10000,
        headers: {
            'User-Agent': 'IndicAgro/1.0 (News Aggregator)'
        }
    });

    try {
        const feed = await parser.parseURL(source.url);

        return (feed.items || []).slice(0, 20).map(item => ({
            title: item.title || 'Sem título',
            link: item.link || source.baseUrl,
            source: source.name,
            sourceUrl: source.baseUrl,
            pubDate: item.pubDate || new Date().toISOString(),
            timeAgo: getTimeAgo(item.pubDate || new Date().toISOString()),
        }));
    } catch (error) {
        console.error(`Erro ao buscar RSS de ${source.name}:`, error);
        return [];
    }
}

/**
 * Busca notícias de todas as fontes e filtra por commodity
 */
export async function fetchNewsForCommodity(slug: string, limit = 5): Promise<NewsItem[]> {
    // Verifica cache
    const cacheKey = `news_${slug}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data.slice(0, limit);
    }

    // Keywords para filtrar
    const keywords = COMMODITY_KEYWORDS[slug] || [slug.replace('-', ' ')];

    // Busca de todas as fontes em paralelo
    const allPromises = RSS_SOURCES.map(source => fetchFromSource(source));
    const results = await Promise.all(allPromises);

    // Combina e filtra por keywords
    let allNews = results.flat();

    // Filtra por keywords (case insensitive)
    const filteredNews = allNews.filter(news => {
        const titleLower = news.title.toLowerCase();
        return keywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
    });

    // Ordena por data (mais recente primeiro)
    filteredNews.sort((a, b) =>
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    // Atualiza cache
    cache.set(cacheKey, { data: filteredNews, timestamp: Date.now() });

    return filteredNews.slice(0, limit);
}

/**
 * Busca todas as notícias (sem filtro por commodity)
 */
export async function fetchAllNews(limit = 20): Promise<NewsItem[]> {
    const cacheKey = 'news_all';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data.slice(0, limit);
    }

    const allPromises = RSS_SOURCES.map(source => fetchFromSource(source));
    const results = await Promise.all(allPromises);

    let allNews = results.flat();

    // Ordena por data
    allNews.sort((a, b) =>
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    cache.set(cacheKey, { data: allNews, timestamp: Date.now() });

    return allNews.slice(0, limit);
}

/**
 * Retorna as keywords disponíveis para uma commodity
 */
export function getKeywordsForCommodity(slug: string): string[] {
    return COMMODITY_KEYWORDS[slug] || [slug.replace('-', ' ')];
}

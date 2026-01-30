/**
 * Agregador de Notícias RSS
 * 
 * Busca notícias de fontes públicas de RSS e filtra por commodity.
 * Abordagem 100% legal: apenas títulos e links, com atribuição de fonte.
 */

import Parser from 'rss-parser';

// Tipos para as notícias
export interface NewsItem {
    slug: string;
    title: string;
    link: string;
    source: string;
    sourceUrl: string;
    pubDate: string;
    timeAgo: string;
    imageUrl?: string | null;
    content?: string;
}

/**
 * Converte string para slug (URL friendly)
 */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Remove acentos
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-') // Espaços para hifens
        .replace(/[^\w\-]+/g, '') // Remove chars especiais
        .replace(/\-\-+/g, '-') // Remove hifens duplicados
        .replace(/^-+/, '') // Remove hifens do inicio
        .replace(/-+$/, ''); // Remove hifens do fim
}

// Interface customizada para o RSS Parser
interface CustomItem {
    'media:content'?: {
        $: {
            url: string;
        }
    };
    enclosure?: {
        url: string;
    };
    contentEncoded?: string;
    content?: string;
    // Campos padrão do rss-parser
    title?: string;
    link?: string;
    pubDate?: string;
}

interface CustomFeed {
    items: CustomItem[];
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
    // Parser tipado com generics para evitar 'any'
    const parser = new Parser<CustomFeed, CustomItem>({
        timeout: 10000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        customFields: {
            item: [
                ['media:content', 'media:content', { keepArray: false }],
                ['enclosure', 'enclosure', { keepArray: false }],
                ['content:encoded', 'contentEncoded'],
            ]
        }
    });

    try {
        const feed = await parser.parseURL(source.url);

        return (feed.items || []).slice(0, 20).map((item) => {
            // Tenta extrair imagem de várias fontes
            let imageUrl: string | null = null;

            // 1. Tenta media:content ou enclosure
            if (item['media:content'] && item['media:content'].$.url) {
                imageUrl = item['media:content'].$.url;
            } else if (item.enclosure && item.enclosure.url) {
                imageUrl = item.enclosure.url;
            }

            // 2. Se não achou, tenta extrair do content:encoded ou description via Regex
            if (item.contentEncoded || item.content) {
                const contentStr = item.contentEncoded || item.content;
                // Type guard para garantir que content é string antes de chamar match
                if (typeof contentStr === 'string' && !imageUrl) {
                    const imgMatch = contentStr.match(/<img[^>]+src="([^">]+)"/);
                    if (imgMatch && imgMatch[1]) {
                        imageUrl = imgMatch[1];
                    }
                }
            }

            const title = item.title || 'Sem título';
            const slug = slugify(title);

            let content = item.contentEncoded || item.content;

            // Remove a imagem destacada do conteúdo para evitar duplicação
            if (imageUrl && typeof content === 'string') {
                // Remove a tag img exata que contém a URL
                const imgRegex = new RegExp(`<img[^>]+src=["']${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
                content = content.replace(imgRegex, '');

                // Limpa tags vazias que podem ter ficado (ex: <figure></figure> ou <p></p>)
                content = content.replace(/<figure>\s*<\/figure>/gi, '')
                    .replace(/<p>\s*<\/p>/gi, '');
            }

            return {
                slug,
                title,
                link: item.link || source.baseUrl,
                source: source.name,
                sourceUrl: source.baseUrl,
                pubDate: item.pubDate || new Date().toISOString(),
                timeAgo: getTimeAgo(item.pubDate || new Date().toISOString()),
                imageUrl: imageUrl,
                content: content
            };
        });
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

    // Busca de todas as fontes em paralelo com tratamento de erro individual
    const results = await Promise.allSettled(RSS_SOURCES.map(source => fetchFromSource(source)));

    // Filtra apenas os sucessos
    const successfulFeeds = results
        .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
        .map(r => r.value);

    // Combina e filtra por keywords
    const allNews = successfulFeeds.flat();

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

    const results = await Promise.allSettled(RSS_SOURCES.map(source => fetchFromSource(source)));

    const successfulFeeds = results
        .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
        .map(r => r.value);

    const allNews = successfulFeeds.flat();

    // Ordena por data
    allNews.sort((a, b) =>
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    cache.set(cacheKey, { data: allNews, timestamp: Date.now() });

    return allNews.slice(0, limit);
}

/**
 * Busca uma notícia pelo slug
 */
export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
    // Tenta buscar no cache geral primeiro
    const cachedAll = cache.get('news_all');
    if (cachedAll) {
        const found = cachedAll.data.find(n => n.slug === slug);
        if (found) return found;
    }

    // Se não achar, busca tudo (que vai popular o cache)
    const allNews = await fetchAllNews(100);
    const found = allNews.find(n => n.slug === slug);

    return found || null;
}

/**
 * Retorna as keywords disponíveis para uma commodity
 */
export function getKeywordsForCommodity(slug: string): string[] {
    return COMMODITY_KEYWORDS[slug] || [slug.replace('-', ' ')];
}

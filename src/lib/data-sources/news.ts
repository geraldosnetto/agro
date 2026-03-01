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

// Fontes RSS públicas (Mapeamento inteligente por Cultura)
const RSS_SOURCES = [
    // --- GERAIS (Trazem notícias de todas as culturas) ---
    { name: 'Globo Rural', url: 'https://g1.globo.com/rss/g1/economia/agronegocios/', baseUrl: 'https://g1.globo.com/economia/agronegocios', tags: ['all'] },
    { name: 'Canal Rural', url: 'https://www.canalrural.com.br/feed/', baseUrl: 'https://www.canalrural.com.br', tags: ['all'] },
    { name: 'Notícias Agrícolas', url: 'https://www.noticiasagricolas.com.br/rss/', baseUrl: 'https://www.noticiasagricolas.com.br', tags: ['all'] },
    { name: 'Agrolink', url: 'https://www.agrolink.com.br/rss/noticias.xml', baseUrl: 'https://www.agrolink.com.br', tags: ['all'] },
    { name: 'CompreRural', url: 'https://www.comprerural.com/feed/', baseUrl: 'https://www.comprerural.com', tags: ['all'] },
    { name: 'Portal do Agronegócio', url: 'https://www.portaldoagronegocio.com.br/feed/', baseUrl: 'https://www.portaldoagronegocio.com.br', tags: ['all'] },
    { name: 'Agro Estadão', url: 'https://agro.estadao.com.br/feed/', baseUrl: 'https://agro.estadao.com.br', tags: ['all'] },
    { name: 'Brasilagro', url: 'https://www.brasilagro.com.br/feed/', baseUrl: 'https://www.brasilagro.com.br', tags: ['all'] },
    { name: 'AgroNoticia', url: 'https://www.agronoticia.com.br/feed/', baseUrl: 'https://www.agronoticia.com.br', tags: ['all'] },

    // --- GRÃOS (Soja, Milho, Trigo, Arroz e Feijão) ---
    { name: 'Embrapa Soja', url: 'https://www.embrapa.br/rss/soja', baseUrl: 'https://www.embrapa.br/soja', tags: ['soja'] },
    { name: 'SAFRAS & Mercado', url: 'https://safras.com.br/feed/', baseUrl: 'https://safras.com.br', tags: ['soja', 'milho', 'trigo', 'cafe', 'algodao'] },
    { name: 'Embrapa Milho e Sorgo', url: 'https://www.embrapa.br/rss/milho-e-sorgo', baseUrl: 'https://www.embrapa.br', tags: ['milho'] },
    { name: 'Revista Cultivar', url: 'https://revistacultivar.com.br/feed/', baseUrl: 'https://revistacultivar.com.br', tags: ['milho', 'soja'] },
    { name: 'Embrapa Trigo', url: 'https://www.embrapa.br/rss/trigo', baseUrl: 'https://www.embrapa.br/trigo', tags: ['trigo'] },
    { name: 'Planeta Arroz', url: 'https://planetaarroz.com.br/feed/', baseUrl: 'https://planetaarroz.com.br', tags: ['arroz'] },
    { name: 'IRGA', url: 'https://irga.rs.gov.br/rss', baseUrl: 'https://irga.rs.gov.br', tags: ['arroz'] },
    { name: 'Embrapa Arroz e Feijão', url: 'https://www.embrapa.br/rss/arroz-e-feijao', baseUrl: 'https://www.embrapa.br', tags: ['arroz', 'feijao'] },
    { name: 'IBRAFE', url: 'https://ibrafe.org/feed/', baseUrl: 'https://ibrafe.org', tags: ['feijao'] },

    // --- RAIZES ---
    { name: 'Embrapa Mandioca', url: 'https://www.embrapa.br/rss/mandioca-e-fruticultura', baseUrl: 'https://www.embrapa.br', tags: ['mandioca'] },
    { name: 'Planeta Campo', url: 'https://planetacampo.com.br/feed/', baseUrl: 'https://planetacampo.com.br', tags: ['mandioca', 'boi-gordo', 'soja', 'milho'] },

    // --- PROTEÍNA ANIMAL (Boi, Suíno, Frango, Ovos, Peixe) ---
    { name: 'BeefPoint', url: 'https://www.beefpoint.com.br/feed/', baseUrl: 'https://www.beefpoint.com.br', tags: ['boi-gordo'] },
    { name: 'Portal DBO', url: 'https://www.portaldbo.com.br/feed/', baseUrl: 'https://www.portaldbo.com.br', tags: ['boi-gordo'] },
    { name: 'Canal do Boi', url: 'https://sba1.com/feed/', baseUrl: 'https://sba1.com', tags: ['boi-gordo'] },
    { name: 'SuiSite', url: 'https://www.suisite.com.br/feed/', baseUrl: 'https://www.suisite.com.br', tags: ['suino'] },
    { name: 'Suínocultura - 3tres3', url: 'https://www.3tres3.com.br/rss/', baseUrl: 'https://www.3tres3.com.br', tags: ['suino'] },
    { name: 'Agrimídia', url: 'https://agrimidia.com.br/feed/', baseUrl: 'https://agrimidia.com.br', tags: ['suino', 'frango', 'ovos', 'boi-gordo'] },
    { name: 'O Presente Rural', url: 'https://opresenterural.com.br/feed/', baseUrl: 'https://opresenterural.com.br', tags: ['suino', 'frango'] },
    { name: 'AviSite', url: 'https://www.avisite.com.br/feed/', baseUrl: 'https://www.avisite.com.br', tags: ['frango', 'ovos'] },
    { name: 'AviNews Brasil', url: 'https://avinews.com/br/feed/', baseUrl: 'https://avinews.com/br', tags: ['frango', 'ovos'] },
    { name: 'OvoSite', url: 'https://www.ovosite.com.br/feed/', baseUrl: 'https://www.ovosite.com.br', tags: ['ovos'] },
    { name: 'Peixe BR', url: 'https://www.peixebr.com.br/feed/', baseUrl: 'https://www.peixebr.com.br', tags: ['tilapia'] },
    { name: 'Aquaculture Brasil', url: 'https://www.aquaculturebrasil.com.br/feed/', baseUrl: 'https://www.aquaculturebrasil.com.br', tags: ['tilapia'] },
    { name: 'Seafood Brasil', url: 'https://seafoodbrasil.com.br/feed/', baseUrl: 'https://seafoodbrasil.com.br', tags: ['tilapia'] },
    { name: 'Panorama da Aquicultura', url: 'https://panoramadaaquicultura.com.br/feed/', baseUrl: 'https://panoramadaaquicultura.com.br', tags: ['tilapia'] },

    // --- LEITE ---
    { name: 'MilkPoint', url: 'https://www.milkpoint.com.br/rss', baseUrl: 'https://www.milkpoint.com.br', tags: ['leite'] },
    { name: 'Canal do Leite', url: 'https://canaldoleite.com/feed/', baseUrl: 'https://canaldoleite.com', tags: ['leite'] },
    { name: 'Revista Laticínios', url: 'https://revistalaticinios.com.br/feed/', baseUrl: 'https://revistalaticinios.com.br', tags: ['leite'] },
    { name: 'Balde Branco', url: 'https://baldebranco.com.br/feed/', baseUrl: 'https://baldebranco.com.br', tags: ['leite'] },

    // --- CAFE e ALGODÃO ---
    { name: 'CaféPoint', url: 'https://www.cafepoint.com.br/rss', baseUrl: 'https://www.cafepoint.com.br', tags: ['cafe'] },
    { name: 'AgnoCafé', url: 'https://agnocafe.com.br/feed/', baseUrl: 'https://agnocafe.com.br', tags: ['cafe'] },
    { name: 'Revista Cafeicultura', url: 'https://revistacafeicultura.com.br/feed/', baseUrl: 'https://revistacafeicultura.com.br', tags: ['cafe'] },
    { name: 'ABRAPA (Algodão)', url: 'https://abrapa.com.br/feed/', baseUrl: 'https://abrapa.com.br', tags: ['algodao'] },

    // --- SUCROENERGÉTICO ---
    { name: 'NovaCana', url: 'https://www.novacana.com/rss', baseUrl: 'https://www.novacana.com', tags: ['acucar', 'etanol', 'etanol-hidratado', 'etanol-anidro'] },
    { name: 'JornalCana', url: 'https://www.jornalcana.com.br/feed/', baseUrl: 'https://www.jornalcana.com.br', tags: ['acucar', 'etanol', 'etanol-hidratado', 'etanol-anidro'] },
    { name: 'RPA News', url: 'https://revistarpanews.com.br/feed/', baseUrl: 'https://revistarpanews.com.br', tags: ['acucar', 'etanol', 'etanol-hidratado', 'etanol-anidro'] },
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

// Palavras-chave para bloquear notícias fora do tema agro
const BLOCKED_KEYWORDS = [
    // Entretenimento
    'música', 'musica', 'show', 'carnaval', 'sertanejo', 'cantora', 'cantor',
    'marília mendonça', 'gusttavo lima', 'rodeio show', 'sofrência',
    // Esportes
    'futebol', 'campeonato', 'corinthians', 'palmeiras', 'flamengo',
    // Política genérica (não agro)
    'eleições municipais', 'vereador', 'prefeito',
    // Outros
    'horóscopo', 'signo', 'astrologia', 'celebridade', 'fofoca',
    'big brother', 'bbb', 'novela', 'reality',
];

/**
 * Verifica se a notícia deve ser bloqueada por conter palavras fora do tema
 */
function shouldBlockNews(title: string, content?: string): boolean {
    const textToCheck = `${title} ${content || ''}`.toLowerCase();
    return BLOCKED_KEYWORDS.some(keyword => textToCheck.includes(keyword.toLowerCase()));
}

// Limite de caracteres para snippet (legal: apenas resumo, não conteúdo completo)
const SNIPPET_MAX_CHARS = 300;

/**
 * Remove tags HTML e cria um snippet limitado
 * Isso é importante para conformidade legal - não copiar conteúdo completo
 */
function createSnippet(htmlContent: string | undefined, maxChars = SNIPPET_MAX_CHARS): string {
    if (!htmlContent) return '';

    // Remove tags HTML
    const textOnly = htmlContent
        .replace(/<[^>]*>/g, ' ')  // Remove tags
        .replace(/&nbsp;/g, ' ')   // Remove &nbsp;
        .replace(/&amp;/g, '&')    // Decode &amp;
        .replace(/&lt;/g, '<')     // Decode &lt;
        .replace(/&gt;/g, '>')     // Decode &gt;
        .replace(/&quot;/g, '"')   // Decode &quot;
        .replace(/\s+/g, ' ')      // Normaliza espaços
        .trim();

    // Limita ao tamanho máximo
    if (textOnly.length <= maxChars) return textOnly;

    // Corta na última palavra completa
    const truncated = textOnly.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');

    return (lastSpace > maxChars * 0.7 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

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

            const contentSnippet = createSnippet(typeof content === 'string' ? content : undefined);

            return {
                slug,
                title,
                link: item.link || source.baseUrl,
                source: source.name,
                sourceUrl: source.baseUrl,
                pubDate: item.pubDate || new Date().toISOString(),
                timeAgo: getTimeAgo(item.pubDate || new Date().toISOString()),
                imageUrl: imageUrl,
                // Snippet limitado para conformidade legal - não copia conteúdo completo
                content: contentSnippet
            };
        }).filter(news => !shouldBlockNews(news.title, news.content));
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

    // Seleciona as fontes baseadas nas tags da cultura para evitar timeouts do servidor
    const relevantSources = RSS_SOURCES.filter(source =>
        source.tags.includes('all') || source.tags.includes(slug)
    );

    // Busca apenas nas fontes relevantes em paralelo com tratamento de erro individual
    const results = await Promise.allSettled(relevantSources.map(source => fetchFromSource(source)));

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

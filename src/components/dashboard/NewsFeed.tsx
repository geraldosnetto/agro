'use client';

/**
 * Componente NewsFeed
 * 
 * Exibe notícias relacionadas a uma commodity.
 * Busca dados da API /api/news/[slug].
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewsItem {
    title: string;
    link: string;
    source: string;
    sourceUrl: string;
    pubDate: string;
    timeAgo: string;
}

interface NewsFeedProps {
    slug: string;
    commodityName: string;
    limit?: number;
}

export function NewsFeed({ slug, commodityName, limit = 5 }: NewsFeedProps) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/news/${slug}?limit=${limit}`);
            const data = await response.json();

            if (data.success) {
                setNews(data.news);
            } else {
                setError('Não foi possível carregar as notícias');
            }
        } catch (err) {
            console.error('Erro ao buscar notícias:', err);
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    }, [slug, limit]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Newspaper className="h-5 w-5 text-primary" />
                    Notícias sobre {commodityName}
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchNews}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {loading && news.length === 0 ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                <div className="h-3 bg-muted rounded w-1/4" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {error}
                    </p>
                ) : news.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma notícia encontrada sobre {commodityName}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {news.map((item, index) => (
                            <a
                                key={index}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                                            {item.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Badge variant="secondary" className="text-xs">
                                                {item.source}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {item.timeAgo}
                                            </span>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Atribuição de fontes */}
                {news.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t">
                        Fontes: Canal Rural, Agrolink • Links abrem em nova aba
                    </p>
                )}
            </CardContent>
        </Card>
    );
}


'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search, Filter, Newspaper, Calendar } from 'lucide-react';

import { type NewsItem } from '@/lib/data-sources/news';

// Verifica se a URL é uma imagem válida (não YouTube, não embed, etc)
function isValidImageUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const invalidPatterns = ['youtube.com', 'youtu.be', '/embed/', 'vimeo.com'];
    return !invalidPatterns.some(pattern => url.includes(pattern));
}

// Converte HTTP para HTTPS e retorna a URL
function getImageSrc(url: string | null | undefined): string {
    if (!isValidImageUrl(url)) return '';
    return url!.replace(/^http:\/\//i, 'https://');
}

// Limpa HTML e trunca o conteúdo para resumo
function getSummary(content: string | undefined, maxLength: number = 300): string {
    if (!content) return '';
    // Remove tags HTML
    let text = content.replace(/<[^>]*>/g, '').trim();
    // Remove créditos de foto (Foto: ..., Crédito: ..., Imagem: ...)
    text = text.replace(/^(Foto|Crédito|Imagem|Créditos?|Reprodução|Divulgação)\s*:\s*[^.]+\.\s*/gi, '');
    text = text.replace(/\(Foto\s*:\s*[^)]+\)\s*/gi, '');
    // Remove espaços extras
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    // Trunca no último espaço antes do limite
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}


interface NewsListProps {
    initialNews: NewsItem[];
    commodities?: string[];
}

export function NewsList({ initialNews }: NewsListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSource, setSelectedSource] = useState('all');
    const [filteredNews, setFilteredNews] = useState(initialNews);

    // Identificar fontes únicas
    const sources = Array.from(new Set(initialNews.map(item => item.source)));

    // Filtrar notícias
    const filterNews = (search: string, source: string) => {
        let filtered = initialNews;

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchLower) ||
                (item.content && item.content.toLowerCase().includes(searchLower))
            );
        }

        if (source && source !== 'all') {
            filtered = filtered.filter(item => item.source === source);
        }

        setFilteredNews(filtered);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        filterNews(val, selectedSource);
    };

    const handleSourceChange = (val: string) => {
        setSelectedSource(val);
        filterNews(searchTerm, val);
    };

    return (
        <div className="space-y-6">
            {/* Filtros e Busca */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar notícias..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="w-full md:w-[200px]">
                            <Select value={selectedSource} onValueChange={handleSourceChange}>
                                <SelectTrigger>
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Fonte" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as fontes</SelectItem>
                                    {sources.map(source => (
                                        <SelectItem key={source} value={source}>
                                            {source}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Grid de Notícias */}
            {filteredNews.length === 0 ? (
                <div className="text-center py-12">
                    <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma notícia encontrada</h3>
                    <p className="text-muted-foreground">Tente ajustar seus termos de busca.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredNews.map((item, index) => (
                        <a
                            key={index}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <Card className="h-full hover:bg-muted/50 transition-colors border-l-4 border-l-primary/0 hover:border-l-primary">
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-3">
                                        {/* Header com imagem e meta */}
                                        <div className="flex gap-4">
                                            {isValidImageUrl(item.imageUrl) && (
                                                <div className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden bg-muted hidden sm:block">
                                                    <img
                                                        src={getImageSrc(item.imageUrl)}
                                                        alt=""
                                                        className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        {item.source}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {item.timeAgo}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                    {item.title}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Resumo do conteúdo */}
                                        {item.content && (
                                            <p className="text-sm text-muted-foreground line-clamp-3">
                                                {getSummary(item.content, 300)}
                                            </p>
                                        )}

                                        {/* Footer */}
                                        <div className="flex justify-end items-center pt-2 mt-auto border-t border-border/50">
                                            <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
                                                Ler na fonte <ExternalLink className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}


'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search, Filter, Newspaper, Calendar } from 'lucide-react';

import { type NewsItem } from '@/lib/data-sources/news';


interface NewsListProps {
    initialNews: NewsItem[];
    commodities: string[];
}

export function NewsList({ initialNews, commodities }: NewsListProps) {
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
                item.title.toLowerCase().includes(searchLower)
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
                        <Card key={index} className="group relative hover:bg-muted/50 transition-colors border-l-4 border-l-primary/0 hover:border-l-primary">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start gap-4 h-full flex-col">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {item.source}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {item.timeAgo}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
                                                {item.title}
                                                <span className="absolute inset-0" aria-hidden="true" />
                                            </a>
                                        </h3>
                                    </div>
                                    <div className="flex justify-between items-center w-full pt-2 mt-auto">
                                        <Button variant="ghost" size="sm" className="ml-auto text-xs h-8 items-center gap-1 pointer-events-none group-hover:bg-primary group-hover:text-primary-foreground">
                                            Ler notícia <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

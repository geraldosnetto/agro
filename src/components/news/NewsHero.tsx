'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewsItem {
    title: string;
    link: string;
    source: string;
    timeAgo: string;
    pubDate: string;
    // Campos opcionais que podem vir de enriquecimento futuro
    summary?: string;
    imageUrl?: string | null;
}

interface NewsHeroProps {
    news: NewsItem[];
}

export function NewsHero({ news }: NewsHeroProps) {
    if (!news || news.length === 0) return null;

    // Garante que temos pelo menos 5 notícias, ou usa as que tem
    const mainNews = news[0];
    const secondaryNews = news.slice(1, 5);

    const handleNewsClick = async (item: NewsItem) => {
        try {
            await fetch('/api/news/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: item.link,
                    title: item.title,
                    source: item.source
                })
            });
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    };

    return (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            {/* Main Featured News (Left - 7 cols) */}
            <div className="lg:col-span-7 group relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-lg border border-border/50">
                <Link
                    href={mainNews.link}
                    target="_blank"
                    className="block h-full w-full"
                    onClick={() => handleNewsClick(mainNews)}
                >
                    <Image
                        src={mainNews.imageUrl || '/placeholder-news.jpg'}
                        alt={mainNews.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 lg:p-8 w-full text-white">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                                Destaque
                            </Badge>
                            <span className="text-xs text-gray-300 font-medium bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                {mainNews.source}
                            </span>
                        </div>
                        <h2 className="text-2xl lg:text-4xl font-bold leading-tight mb-2 line-clamp-3 group-hover:text-primary-foreground/90 transition-colors">
                            {mainNews.title}
                        </h2>
                        {mainNews.summary && (
                            <p className="text-gray-300 line-clamp-2 hidden md:block text-sm lg:text-base max-w-[90%]">
                                {mainNews.summary}
                            </p>
                        )}
                        <p className="text-xs text-gray-400 mt-4 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {formatDistanceToNow(new Date(mainNews.pubDate), { addSuffix: true, locale: ptBR })}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Secondary News Grid (Right - 5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:h-[500px]">
                {secondaryNews.map((item, index) => (
                    <Link
                        key={`${item.source}-${index}`}
                        href={item.link}
                        target="_blank"
                        className="group flex gap-4 bg-card hover:bg-muted/50 p-3 rounded-lg border transition-all h-[115px] overflow-hidden"
                        onClick={() => handleNewsClick(item)}
                    >
                        <div className="relative w-[120px] h-full shrink-0 rounded-md overflow-hidden">
                            <Image
                                src={item.imageUrl || '/placeholder-news.jpg'}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                        </div>
                        <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                    {item.source}
                                </span>
                                <h3 className="text-sm font-semibold line-clamp-3 leading-snug group-hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                            </div>
                            <time className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(item.pubDate), { addSuffix: true, locale: ptBR })}
                            </time>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

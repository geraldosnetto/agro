
import { Metadata } from 'next';
import { fetchAllNews } from '@/lib/data-sources/news';
import { NewsList } from '@/components/dashboard/NewsList';
import { Newspaper } from 'lucide-react';
import { NewsHero } from '@/components/news/NewsHero';
import { NewsSidebar } from '@/components/news/NewsSidebar';
import { VideoSection } from '@/components/news/VideoSection';

export const metadata: Metadata = {
    title: 'Notícias do Agronegócio | IndicAgro',
    description: 'Feed de notícias atualizado do agronegócio brasileiro, principais commodities e análises de mercado.',
};

export const dynamic = 'force-dynamic';

export default async function NoticiasPage() {
    const news = await fetchAllNews(50);

    return (
        <div className="space-y-8">
            <div className="container mx-auto p-6 pb-0">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Newspaper className="h-8 w-8 text-primary" />
                        Notícias do Agronegócio
                    </h1>
                    <p className="text-muted-foreground">
                        Acompanhe as últimas notícias e análises dos principais veículos do setor.
                    </p>
                </div>

                {/* Seção Hero (Destaques) */}
                <NewsHero news={news} />

                {/* Layout Principal (Feed + Sidebar) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                    {/* Feed de Notícias (Esquerda) */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">
                                Últimas Notícias
                            </h2>
                        </div>
                        <NewsList initialNews={news.slice(5)} commodities={[]} />
                    </div>

                    {/* Sidebar (Direita) */}
                    <div className="lg:col-span-4">
                        <NewsSidebar />
                    </div>
                </div>
            </div>

            {/* Seção de Vídeos (Full Width) */}
            <VideoSection />

            <div className="container mx-auto px-6 pb-8 text-center text-sm text-muted-foreground">
                <p>
                    Agregador de notícias automatizado. Fontes: Canal Rural, Agrolink.
                </p>
            </div>
        </div>
    );
}


import { Metadata } from 'next';
import { fetchAllNews } from '@/lib/data-sources/news';
import { NewsList } from '@/components/dashboard/NewsList';
import { Newspaper } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Notícias do Agronegócio | IndicAgro',
    description: 'Feed de notícias atualizado do agronegócio brasileiro, principais commodities e análises de mercado.',
};

export const revalidate = 3600; // 1 hora

export default async function NoticiasPage() {
    const news = await fetchAllNews(50); // Buscar 50 últimas

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Newspaper className="h-8 w-8 text-primary" />
                    Notícias do Agronegócio
                </h1>
                <p className="text-muted-foreground">
                    Acompanhe as últimas notícias e análises dos principais veículos do setor.
                </p>
            </div>

            <NewsList initialNews={news} commodities={[]} />

            <div className="text-center text-sm text-muted-foreground pt-8 pb-4">
                <p>
                    Agregador de notícias automatizado. Fontes: Canal Rural, Agrolink.
                </p>
            </div>
        </div>
    );
}

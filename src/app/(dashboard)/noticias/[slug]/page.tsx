
import { Metadata } from 'next';
import { getNewsBySlug, fetchAllNews } from '@/lib/data-sources/news';
import { notFound } from 'next/navigation';
import { formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, User, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { AdsWidget } from '@/components/news/AdsWidget';
import { PodcastWidget } from '@/components/news/PodcastWidget';
import { NewsSidebar } from '@/components/news/NewsSidebar';
import { SocialShare } from '@/components/news/SocialShare';
import { RelatedNews } from '@/components/news/RelatedNews';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Gera metadata dinâmica para SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const news = await getNewsBySlug(slug);

    if (!news) {
        return {
            title: 'Notícia não encontrada | IndicAgro',
        };
    }

    return {
        title: `${news.title} | IndicAgro`,
        description: news.content ? news.content.substring(0, 160) + '...' : `Leia a notícia completa sobre ${news.title} no IndicAgro.`,
        openGraph: {
            title: news.title,
            description: news.content ? news.content.substring(0, 160) + '...' : undefined,
            images: news.imageUrl ? [news.imageUrl] : [],
        },
    };
}

// Gera params estáticos para as notícias mais recentes (ISR)
export async function generateStaticParams() {
    const news = await fetchAllNews(20);
    return news.map((item) => ({
        slug: item.slug,
    }));
}

export const revalidate = 3600; // Recache a cada 1 hora

export default async function NewsArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const news = await getNewsBySlug(slug);

    if (!news) {
        notFound();
    }

    return (
        <div className="container mx-auto p-6 md:py-10">
            {/* Breadcrumb / Back */}
            <div className="mb-6">
                <Link href="/noticias" className="text-muted-foreground hover:text-primary flex items-center gap-1 text-sm transition-colors w-fit">
                    <ChevronLeft className="h-4 w-4" />
                    Voltar para Notícias
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Coluna Principal (Conteúdo) */}
                <main className="lg:col-span-8">
                    <article>
                        {/* Header da Notícia */}
                        <header className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    {news.source}
                                </span>
                                <span className="text-sm text-muted-foreground flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {news.timeAgo}
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
                                {news.title}
                            </h1>

                            <div className="flex items-center justify-between border-y py-4 mt-6">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(new Date(news.pubDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        Redação {news.source}
                                    </div>
                                </div>
                                <SocialShare title={news.title} />
                            </div>
                        </header>

                        {/* Imagem Principal */}
                        {news.imageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-8 bg-muted">
                                <img
                                    src={news.imageUrl}
                                    alt={news.title}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}

                        {/* Conteúdo da Notícia */}
                        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                            {news.content ? (
                                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(news.content) }} />
                            ) : (
                                <div className="bg-muted/30 p-8 rounded-xl border text-center my-8">
                                    <p className="text-lg text-muted-foreground mb-6 italic">
                                        &quot;Esta notícia é um destaque externo. Para ler o conteúdo completo, acesse o site original.&quot;
                                    </p>
                                    <Button asChild size="lg" className="font-bold gap-2">
                                        <Link href={news.link} target="_blank" rel="noopener noreferrer">
                                            Ler notícia completa em {news.source}
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Botão de Fonte (sempre visível ao final) */}
                        {news.content && (
                            <div className="mt-8 pt-6 border-t flex justify-end">
                                <Button variant="outline" asChild className="gap-2">
                                    <Link href={news.link} target="_blank" rel="noopener noreferrer">
                                        Ver original em {news.source}
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </article>

                    <RelatedNews currentSlug={news.slug} />
                </main>

                {/* Sidebar */}
                <aside className="lg:col-span-4 space-y-8">
                    {/* Anúncio Topo Sidebar */}
                    <AdsWidget />

                    {/* Widgets Existentes + Novos */}
                    <div className="sticky top-24 space-y-8">
                        <NewsSidebar />

                        <PodcastWidget />

                        <AdsWidget type="sidebar" className="bg-blue-50/5 border-blue-200/20" />
                    </div>
                </aside>
            </div>
        </div>
    );
}

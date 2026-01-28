import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp } from 'lucide-react';
import prisma from "@/lib/prisma";

async function getMostReadNews() {
    try {
        return await prisma.newsAccess.findMany({
            orderBy: { clicks: 'desc' },
            take: 5,
        });
    } catch (error) {
        console.error("Error fetching most read news:", error);
        return [];
    }
}

export async function NewsSidebar() {
    const mostRead = await getMostReadNews();

    return (
        <aside className="space-y-8">
            {/* Ad Widget */}
            <div className="bg-muted/50 border rounded-xl overflow-hidden aspect-square flex items-center justify-center relative group">
                <div className="text-center p-6">
                    <p className="text-muted-foreground font-medium text-lg mb-2">
                        DADOS <span className="text-primary font-bold">PRIMÁRIOS</span>
                    </p>
                    <p className="text-sm text-muted-foreground/80 mb-4">
                        ANÁLISES RELEVANTES PARA O MERCADO GLOBAL DE AGRONEGÓCIOS.
                    </p>
                    <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        SABER MAIS
                    </Button>
                </div>
            </div>

            {/* Mais Lidas Widget */}
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Mais lidas
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                    {mostRead.length > 0 ? (
                        mostRead.map((item) => (
                            <Link key={item.url} href={item.url} target="_blank" className="group block">
                                <span className="text-xs font-bold text-primary/60 mb-1 block uppercase">{item.source}</span>
                                <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                                    {item.title}
                                </h4>
                                <div className="h-px bg-border mt-3" />
                            </Link>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma notícia em destaque ainda.</p>
                    )}
                </CardContent>
            </Card>

            {/* Newsletter / Podcast Widget */}
            <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-2">Podcast Agro</h3>
                    <p className="text-sm text-green-100/80 mb-4">
                        Resumo diário do mercado em 5 minutos.
                    </p>
                    <Button size="sm" variant="secondary" className="w-full text-green-900 font-bold hover:bg-white">
                        OUVIR AGORA <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full blur-2xl" />
            </div>
        </aside>
    );
}

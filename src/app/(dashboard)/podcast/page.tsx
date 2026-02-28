import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Headphones, Calendar, Clock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "AgroCast - IndicAgro",
    description: "Ouça o resumo semanal do mercado agropecuário gerado por Inteligência Artificial.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PodcastPage() {
    const episodes = await prisma.podcastEpisode.findMany({
        orderBy: { publishedAt: "desc" },
    });

    const latsetEpisode = episodes[0];
    const olderEpisodes = episodes.slice(1);

    return (
        <div className="space-y-8 flex-1 max-w-5xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Headphones className="w-8 h-8 text-primary" />
                    AgroCast Semanal
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                    Seu resumo completo das movimentações de preço, notícias e clima. Otimize seu tempo ouvindo nossa análise quinzenal enquanto se desloca.
                </p>
            </div>

            {episodes.length === 0 ? (
                <div className="border border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center bg-muted/20">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        <Headphones className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhum episódio disponível</h3>
                    <p className="text-muted-foreground max-w-md">
                        Nossa IA ainda está processando os dados do mercado para gravar o primeiro episódio. Volte mais tarde!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold inline-flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Último Lançamento
                        </h2>

                        <Card className="overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm shadow-xl relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                            <CardHeader className="relative pb-4 border-b border-primary/10 bg-muted/20">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                                            {latsetEpisode.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 font-medium">
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <Calendar className="w-4 h-4 shrink-0 text-primary/70" />
                                                {format(latsetEpisode.publishedAt, "dd 'de' MMMM", { locale: ptBR })}
                                            </span>
                                            {latsetEpisode.duration && (
                                                <span className="flex items-center gap-1.5 min-w-0">
                                                    <Clock className="w-4 h-4 shrink-0 text-primary/70" />
                                                    {Math.floor(latsetEpisode.duration / 60)} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex h-12 w-12 rounded-full bg-primary text-primary-foreground items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                        <PlayCircle className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 relative">
                                <p className="text-muted-foreground leading-relaxed">
                                    {latsetEpisode.description}
                                </p>
                            </CardContent>
                            <CardFooter className="bg-muted/10 relative p-6 pt-2">
                                <audio controls className="w-full mt-4 h-12 outline-none group-hover:shadow-md transition-shadow rounded-full overflow-hidden [&::-webkit-media-controls-panel]:bg-background [&::-webkit-media-controls-enclosure]:bg-muted/40 [&::-webkit-media-controls-enclosure]:backdrop-blur">
                                    <source src={latsetEpisode.audioUrl} type="audio/mpeg" />
                                    Seu navegador não suporta o elemento de áudio.
                                </audio>
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Anteriores</h2>

                        <div className="space-y-4">
                            {olderEpisodes.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-xl border border-dashed text-center">
                                    Não há episódios anteriores.
                                </p>
                            ) : (
                                olderEpisodes.map((ep: any) => (
                                    <Card key={ep.id} className="hover:border-primary/30 transition-colors group bg-background/40">
                                        <CardContent className="p-4 flex flex-col gap-3">
                                            <div>
                                                <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors mb-1" title={ep.title}>
                                                    {ep.title}
                                                </h4>
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <Calendar className="w-3 h-3 text-primary/60" />
                                                    {format(ep.publishedAt, "dd/MM/yyyy")}
                                                </span>
                                            </div>
                                            <audio controls className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity [&::-webkit-media-controls-enclosure]:bg-muted/80">
                                                <source src={ep.audioUrl} type="audio/mpeg" />
                                            </audio>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

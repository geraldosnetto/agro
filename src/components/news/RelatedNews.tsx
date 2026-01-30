
import Link from "next/link";
import { fetchAllNews } from "@/lib/data-sources/news";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

// Verifica se a URL é uma imagem válida (não YouTube, não embed, etc)
function isValidImageUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const invalidPatterns = ['youtube.com', 'youtu.be', '/embed/', 'vimeo.com'];
    return !invalidPatterns.some(pattern => url.includes(pattern));
}

export async function RelatedNews({ currentSlug }: { currentSlug: string }) {
    const allNews = await fetchAllNews(6); // Busca um pouco mais para garantir que tenhamos 3 diferentes
    const related = allNews.filter(n => n.slug !== currentSlug).slice(0, 3);

    return (
        <div className="mt-12 pt-8 border-t">
            <h3 className="text-2xl font-bold mb-6">Leia também</h3>
            <div className="grid md:grid-cols-3 gap-6">
                {related.map((item) => (
                    <Link key={item.slug} href={`/noticias/${item.slug}`} className="group">
                        <Card className="h-full overflow-hidden border-none shadow-none bg-transparent hover:bg-muted/30 transition-colors">
                            {isValidImageUrl(item.imageUrl) && (
                                <div className="aspect-video relative overflow-hidden rounded-lg mb-3">
                                    <img
                                        src={item.imageUrl!}
                                        alt={item.title}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            )}
                            <CardContent className="p-0">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                    <span className="font-semibold text-primary/80 uppercase tracking-wider text-[10px]">{item.source}</span>
                                    <span>•</span>
                                    <span className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {item.timeAgo}
                                    </span>
                                </div>
                                <h4 className="font-bold leading-tight group-hover:text-primary transition-colors line-clamp-3">
                                    {item.title}
                                </h4>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

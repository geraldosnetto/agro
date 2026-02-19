"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Heart, Trash2, TrendingUp, TrendingDown, Bell, ExternalLink } from "lucide-react";
import { formatarUnidade, formatarCategoria, formatarMoeda } from "@/lib/formatters";
import { getCategoriaConfig, getCategoriaLabel } from '@/lib/categories';

interface Favorito {
    id: string;
    commodityId: string;
    createdAt: string;
    commodity: {
        id: string;
        nome: string;
        slug: string;
        unidade: string;
        categoria: string;
        precoAtual: number;
        variacao: number;
        dataAtualizacao: string | null;
    } | null;
}

export default function FavoritosPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [favoritos, setFavoritos] = useState<Favorito[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/favoritos");
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user) {
            fetchFavoritos();
        }
    }, [session]);

    const fetchFavoritos = async () => {
        try {
            const res = await fetch("/api/favoritos");
            if (res.ok) {
                const data = await res.json();
                setFavoritos(data);
            }
        } catch (error) {
            console.error("Erro ao buscar favoritos:", error);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorito = async (commoditySlug: string) => {
        try {
            const res = await fetch(`/api/favoritos?commodityId=${commoditySlug}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setFavoritos((prev) => prev.filter((f) => f.commodity?.slug !== commoditySlug));
            }
        } catch (error) {
            console.error("Erro ao remover favorito:", error);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="container px-4 py-8 max-w-4xl">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="container px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Heart className="h-8 w-8 fill-rose-500 text-rose-500" />
                        Meus Favoritos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {favoritos.length} commodity{favoritos.length !== 1 ? "s" : ""} favoritada{favoritos.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Link href="/cotacoes">
                    <Button variant="outline">
                        Ver Todas as Cotações
                    </Button>
                </Link>
            </div>

            {/* Empty State */}
            {favoritos.length === 0 && (
                <Card className="text-center py-12">
                    <CardContent>
                        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Nenhum favorito ainda</h2>
                        <p className="text-muted-foreground mb-6">
                            Adicione commodities aos favoritos para acompanhá-las mais facilmente.
                        </p>
                        <Link href="/cotacoes">
                            <Button>
                                Explorar Cotações
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Favorites Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {favoritos.map((favorito) => {
                    if (!favorito.commodity) return null;

                    const { commodity } = favorito;
                    const isPositive = commodity.variacao >= 0;
                    const categoria = formatarCategoria(commodity.categoria);

                    return (
                        <Card key={favorito.id} className="group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={getCategoriaConfig(categoria).badgeClassName}>
                                            {getCategoriaLabel(commodity.categoria)}
                                        </Badge>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remover dos favoritos?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {commodity.nome} será removida da sua lista de favoritos.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => removeFavorito(commodity.slug)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Remover
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <Link href={`/cotacoes/${commodity.slug}`} className="block">
                                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                                        {commodity.nome}
                                    </h3>

                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-2xl font-bold">
                                            {formatarMoeda(commodity.precoAtual)}
                                        </span>
                                        <span className="text-muted-foreground">
                                            /{formatarUnidade(commodity.unidade)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full border ${isPositive
                                                ? "text-positive bg-positive-muted border-positive-subtle"
                                                : "text-negative bg-negative-muted border-negative-subtle"
                                                }`}
                                        >
                                            {isPositive ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {isPositive ? "+" : ""}{commodity.variacao.toFixed(2)}%
                                        </span>
                                    </div>
                                </Link>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                                    <Link href={`/cotacoes/${commodity.slug}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Ver Detalhes
                                        </Button>
                                    </Link>
                                    <Link href={`/alertas/novo?commodity=${commodity.slug}`}>
                                        <Button variant="outline" size="sm">
                                            <Bell className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Info */}
            {favoritos.length > 0 && (
                <Card className="mt-8 bg-muted/50">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                            <strong>Dica:</strong> Seus favoritos são sincronizados automaticamente entre dispositivos.
                            Você também pode criar alertas de preço para receber notificações.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

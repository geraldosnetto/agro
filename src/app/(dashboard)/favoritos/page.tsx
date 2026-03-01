"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/ui/data-state-loaders";
import { DataStateEmpty } from "@/components/ui/data-state-empty";
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
import { Star, Heart, Trash2, Bell, ExternalLink, TrendingUp, TrendingDown, Clock, Search, Calendar } from "lucide-react";
import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { formatarUnidade, formatarCategoria, formatarMoeda } from "@/lib/formatters";
import { getCategoriaConfig, getCategoriaLabel } from '@/lib/categories';
import { VariationBadge } from "@/components/VariationBadge";

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
            <div className="container px-4 py-6 md:py-8 max-w-4xl">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="container px-4 py-6 md:py-8 max-w-4xl">
            {/* Header */}
            <PageHeader
                title="Meus Favoritos"
                description="Acompanhe suas commodities favoritas em um só lugar."
                icon={Star}
            >
                <Link href="/cotacoes">
                    <Button variant="outline" className="w-full md:w-auto">
                        Ver Todas as Cotações
                    </Button>
                </Link>
            </PageHeader>

            {/* Empty State */}
            {favoritos.length === 0 && (
                <DataStateEmpty
                    icon={Heart}
                    title="Nenhum favorito ainda"
                    description="Adicione commodities aos favoritos para acompanhá-las mais facilmente."
                    action={
                        <Link href="/cotacoes">
                            <Button>
                                Explorar Cotações
                            </Button>
                        </Link>
                    }
                />
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
                                        <VariationBadge value={commodity.variacao} />
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

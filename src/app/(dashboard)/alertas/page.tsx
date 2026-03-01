"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Percent, AlertTriangle } from "lucide-react";
import { formatarUnidade } from "@/lib/formatters";

interface Alerta {
    id: string;
    commodityId: string;
    tipo: "ACIMA" | "ABAIXO" | "VARIACAO";
    valorAlvo: number | null;
    percentual: number | null;
    ativo: boolean;
    disparado: boolean;
    createdAt: string;
    commodity: {
        nome: string;
        slug: string;
        unidade: string;
        precoAtual: number;
    } | null;
}

export default function AlertasPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/alertas");
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user) {
            fetchAlertas();
        }
    }, [session]);

    const fetchAlertas = async () => {
        try {
            const res = await fetch("/api/alertas");
            if (res.ok) {
                const data = await res.json();
                setAlertas(data);
            }
        } catch (error) {
            console.error("Erro ao buscar alertas:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAlerta = async (id: string, ativo: boolean) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/alertas/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ativo }),
            });

            if (res.ok) {
                setAlertas((prev) =>
                    prev.map((a) => (a.id === id ? { ...a, ativo, disparado: false } : a))
                );
            }
        } catch (error) {
            console.error("Erro ao atualizar alerta:", error);
        } finally {
            setUpdating(null);
        }
    };

    const deleteAlerta = async (id: string) => {
        try {
            const res = await fetch(`/api/alertas/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setAlertas((prev) => prev.filter((a) => a.id !== id));
            }
        } catch (error) {
            console.error("Erro ao excluir alerta:", error);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="container px-4 py-8 max-w-4xl">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const alertasAtivos = alertas.filter((a) => a.ativo).length;

    return (
        <div className="container px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Bell className="h-8 w-8 text-primary" />
                        Meus Alertas
                    </h1>
                    <Link href="/alertas/novo">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Alerta
                        </Button>
                    </Link>
                </div>
                <p className="text-muted-foreground">
                    Gerencie seus alertas de preço e acompanhe o mercado.
                </p>
            </div>

            {/* Empty State */}
            {alertas.length === 0 && (
                <Card className="text-center py-12">
                    <CardContent>
                        <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Nenhum alerta configurado</h2>
                        <p className="text-muted-foreground mb-6">
                            Crie alertas para ser notificado quando uma commodity atingir o preço desejado.
                        </p>
                        <Link href="/alertas/novo">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Criar Primeiro Alerta
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Alerts List */}
            <div className="space-y-4">
                {alertas.map((alerta) => (
                    <Card
                        key={alerta.id}
                        className={!alerta.ativo ? "opacity-60" : alerta.disparado ? "border-amber-500" : ""}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {alerta.tipo === "ACIMA" && (
                                        <div className="p-2 rounded-full bg-positive-muted">
                                            <TrendingUp className="h-5 w-5 text-positive" />
                                        </div>
                                    )}
                                    {alerta.tipo === "ABAIXO" && (
                                        <div className="p-2 rounded-full bg-negative-muted">
                                            <TrendingDown className="h-5 w-5 text-negative" />
                                        </div>
                                    )}
                                    {alerta.tipo === "VARIACAO" && (
                                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                            <Percent className="h-5 w-5 text-blue-600" />
                                        </div>
                                    )}
                                    <div>
                                        <CardTitle className="text-lg">
                                            {alerta.commodity?.nome || "Commodity removida"}
                                        </CardTitle>
                                        <CardDescription>
                                            {alerta.tipo === "ACIMA" && "Preço acima de"}
                                            {alerta.tipo === "ABAIXO" && "Preço abaixo de"}
                                            {alerta.tipo === "VARIACAO" && "Variação maior que"}
                                            {" "}
                                            <span className="font-semibold text-foreground">
                                                {alerta.tipo === "VARIACAO"
                                                    ? `${alerta.percentual}%`
                                                    : `R$ ${alerta.valorAlvo?.toFixed(2)}`}
                                            </span>
                                            {alerta.commodity && alerta.tipo !== "VARIACAO" && (
                                                <span className="text-muted-foreground">
                                                    /{formatarUnidade(alerta.commodity.unidade)}
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {alerta.disparado && (
                                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Disparado
                                        </Badge>
                                    )}
                                    <Switch
                                        checked={alerta.ativo}
                                        onCheckedChange={(checked) => toggleAlerta(alerta.id, checked)}
                                        disabled={updating === alerta.id}
                                    />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {alerta.commodity && (
                                        <>
                                            Preço atual:{" "}
                                            <span className="font-medium text-foreground">
                                                R$ {alerta.commodity.precoAtual.toFixed(2)}
                                            </span>
                                            {alerta.tipo !== "VARIACAO" && alerta.valorAlvo && (
                                                <span className="ml-2">
                                                    (
                                                    {alerta.tipo === "ACIMA"
                                                        ? alerta.commodity.precoAtual >= alerta.valorAlvo
                                                            ? "Atingido!"
                                                            : `faltam R$ ${(alerta.valorAlvo - alerta.commodity.precoAtual).toFixed(2)}`
                                                        : alerta.commodity.precoAtual <= alerta.valorAlvo
                                                            ? "Atingido!"
                                                            : `faltam R$ ${(alerta.commodity.precoAtual - alerta.valorAlvo).toFixed(2)}`}
                                                    )
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {alerta.commodity && (
                                        <Link href={`/cotacoes/${alerta.commodity.slug}`}>
                                            <Button variant="ghost" size="sm">
                                                Ver Cotação
                                            </Button>
                                        </Link>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Excluir alerta?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação não pode ser desfeita. O alerta para{" "}
                                                    {alerta.commodity?.nome} será removido permanentemente.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteAlerta(alerta.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Excluir
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Info */}
            {alertas.length > 0 && (
                <Card className="mt-8 bg-muted/50">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                            <strong>Como funciona:</strong> Quando o preço de uma commodity atingir o valor configurado,
                            você receberá uma notificação por email. Alertas disparados ficam marcados e são
                            automaticamente desativados para evitar notificações repetidas.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

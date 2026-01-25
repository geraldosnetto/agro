"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Bell, TrendingUp, TrendingDown, Percent, Loader2, AlertCircle } from "lucide-react";
import { formatarUnidade } from "@/lib/formatters";

interface Commodity {
    id: string;
    nome: string;
    slug: string;
    unidade: string;
    precoAtual: number;
}

function NovoAlertaForm() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedSlug = searchParams.get("commodity");

    const [commodities, setCommodities] = useState<Commodity[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedCommodity, setSelectedCommodity] = useState<string>("");
    const [tipo, setTipo] = useState<"ACIMA" | "ABAIXO" | "VARIACAO">("ACIMA");
    const [valorAlvo, setValorAlvo] = useState<string>("");
    const [percentual, setPercentual] = useState<string>("5");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/alertas/novo");
        }
    }, [status, router]);

    useEffect(() => {
        fetchCommodities();
    }, []);

    useEffect(() => {
        // Pre-select commodity if provided in URL
        if (preSelectedSlug && commodities.length > 0) {
            const commodity = commodities.find((c) => c.slug === preSelectedSlug);
            if (commodity) {
                setSelectedCommodity(commodity.id);
                // Set a reasonable default value based on current price
                setValorAlvo((commodity.precoAtual * 1.05).toFixed(2));
            }
        }
    }, [preSelectedSlug, commodities]);

    const fetchCommodities = async () => {
        try {
            const res = await fetch("/api/cotacoes");
            if (res.ok) {
                const data = await res.json();
                // API returns { cotacoes: [...], dolar: {...}, meta: {...} }
                const commoditiesWithPrice = data.cotacoes.map((c: {
                    slug: string;
                    nome: string;
                    unidade: string;
                    valor: number;
                }) => ({
                    id: c.slug, // Use slug as ID since API doesn't return ID
                    nome: c.nome,
                    slug: c.slug,
                    unidade: c.unidade,
                    precoAtual: c.valor ?? 0,
                }));
                setCommodities(commoditiesWithPrice);
            }
        } catch (err) {
            console.error("Erro ao buscar commodities:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const body: {
                commodityId: string;
                tipo: "ACIMA" | "ABAIXO" | "VARIACAO";
                valorAlvo?: number;
                percentual?: number;
            } = {
                commodityId: selectedCommodity,
                tipo,
            };

            if (tipo === "VARIACAO") {
                body.percentual = parseFloat(percentual);
            } else {
                body.valorAlvo = parseFloat(valorAlvo);
            }

            const res = await fetch("/api/alertas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao criar alerta");
                return;
            }

            router.push("/alertas");
        } catch {
            setError("Erro ao criar alerta. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCommodityData = commodities.find((c) => c.id === selectedCommodity);

    if (status === "loading" || loading) {
        return (
            <div className="container px-4 py-8 max-w-2xl">
                <Skeleton className="h-8 w-32 mb-8" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="container px-4 py-8 max-w-2xl">
            {/* Back button */}
            <Link href="/alertas" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Alertas
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Novo Alerta de Preço
                    </CardTitle>
                    <CardDescription>
                        Configure um alerta para ser notificado quando o preço atingir o valor desejado.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Commodity Select */}
                        <div className="space-y-2">
                            <Label htmlFor="commodity">Commodity</Label>
                            <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                                <SelectTrigger id="commodity">
                                    <SelectValue placeholder="Selecione uma commodity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {commodities.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.nome} - R$ {c.precoAtual.toFixed(2)}/{formatarUnidade(c.unidade)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Alert Type */}
                        <div className="space-y-3">
                            <Label>Tipo de Alerta</Label>
                            <RadioGroup
                                value={tipo}
                                onValueChange={(v) => setTipo(v as "ACIMA" | "ABAIXO" | "VARIACAO")}
                                className="grid grid-cols-1 gap-3"
                            >
                                <label
                                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                        tipo === "ACIMA" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                                    }`}
                                >
                                    <RadioGroupItem value="ACIMA" id="acima" />
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    <div>
                                        <p className="font-medium">Preço Acima de</p>
                                        <p className="text-sm text-muted-foreground">
                                            Notificar quando o preço subir acima do valor
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                        tipo === "ABAIXO" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                                    }`}
                                >
                                    <RadioGroupItem value="ABAIXO" id="abaixo" />
                                    <TrendingDown className="h-5 w-5 text-rose-600" />
                                    <div>
                                        <p className="font-medium">Preço Abaixo de</p>
                                        <p className="text-sm text-muted-foreground">
                                            Notificar quando o preço cair abaixo do valor
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                        tipo === "VARIACAO" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                                    }`}
                                >
                                    <RadioGroupItem value="VARIACAO" id="variacao" />
                                    <Percent className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium">Variação Percentual</p>
                                        <p className="text-sm text-muted-foreground">
                                            Notificar quando a variação diária for maior que X%
                                        </p>
                                    </div>
                                </label>
                            </RadioGroup>
                        </div>

                        {/* Value Input */}
                        {tipo !== "VARIACAO" ? (
                            <div className="space-y-2">
                                <Label htmlFor="valorAlvo">Valor Alvo (R$)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        R$
                                    </span>
                                    <Input
                                        id="valorAlvo"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0,00"
                                        value={valorAlvo}
                                        onChange={(e) => setValorAlvo(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                    {selectedCommodityData && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                            /{formatarUnidade(selectedCommodityData.unidade)}
                                        </span>
                                    )}
                                </div>
                                {selectedCommodityData && (
                                    <p className="text-sm text-muted-foreground">
                                        Preço atual: R$ {selectedCommodityData.precoAtual.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="percentual">Percentual (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="percentual"
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        max="100"
                                        placeholder="5"
                                        value={percentual}
                                        onChange={(e) => setPercentual(e.target.value)}
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        %
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Você será notificado quando a variação diária for maior que {percentual || "0"}%
                                </p>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={!selectedCommodity || submitting} className="flex-1">
                                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Criar Alerta
                            </Button>
                            <Link href="/alertas">
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function NovoAlertaSkeleton() {
    return (
        <div className="container px-4 py-8 max-w-2xl">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    );
}

export default function NovoAlertaPage() {
    return (
        <Suspense fallback={<NovoAlertaSkeleton />}>
            <NovoAlertaForm />
        </Suspense>
    );
}

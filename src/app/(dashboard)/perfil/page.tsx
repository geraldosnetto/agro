import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Shield, AlertCircle, TrendingUp, Sparkles, Plus, Clock, User, Calendar, Crown, Bell, Heart, Settings, CheckCircle, XCircle } from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DeleteAccountButton } from "@/components/auth/DeleteAccountButton";
import Link from "next/link";
import { createCustomerPortal } from "../planos/actions";

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Fetch user data with alerts and favorites count
    const userData = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            _count: {
                select: {
                    alertas: true,
                    favoritos: true,
                },
            },
        },
    });

    if (!userData) {
        redirect("/login");
    }

    const planLabels: Record<string, { label: string; className: string }> = {
        free: { label: "Gratuito", className: "bg-muted text-muted-foreground" },
        pro: { label: "Pro", className: "bg-primary text-primary-foreground" },
        business: { label: "Business", className: "bg-amber-500 text-white" },
    };

    const userPlan = planLabels[userData.plan] || planLabels.free;
    const initials = userData.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    const isEmailVerified = !!userData.emailVerified;

    return (
        <div className="container max-w-4xl py-10">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <User className="h-8 w-8 text-primary" />
                    Meu Perfil
                </h1>
                <p className="text-muted-foreground">
                    Gerencie suas informações e preferências
                </p>
            </div>

            <div className="grid gap-6">
                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={userData.image || undefined} alt={userData.name || "User"} />
                                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-2xl">{userData.name || "Usuário"}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Mail className="h-4 w-4" />
                                        {userData.email}
                                        {isEmailVerified ? (
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Verificado
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Não verificado
                                            </Badge>
                                        )}
                                    </CardDescription>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge className={userPlan.className}>
                                            <Crown className="h-3 w-3 mr-1" />
                                            {userPlan.label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Link href="/configuracoes">
                                <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <Heart className="h-5 w-5 mx-auto mb-2 text-rose-500" />
                                <p className="text-2xl font-bold">{userData._count.favoritos}</p>
                                <p className="text-sm text-muted-foreground">Favoritos</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <Bell className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                                <p className="text-2xl font-bold">{userData._count.alertas}</p>
                                <p className="text-sm text-muted-foreground">Alertas</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <User className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                                <p className="text-2xl font-bold">{userData.plan === "free" ? "5" : "Ilimitado"}</p>
                                <p className="text-sm text-muted-foreground">Commodities</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/50">
                                <Calendar className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                                <p className="text-2xl font-bold">
                                    {new Date(userData.createdAt).toLocaleDateString("pt-BR", {
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                                <p className="text-sm text-muted-foreground">Membro desde</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Seu Plano</CardTitle>
                        <CardDescription>
                            Gerencie sua assinatura e recursos disponíveis
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Crown className="h-4 w-4" />
                                    Plano {userPlan.label}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {userData.plan === "free"
                                        ? "Acesso básico às cotações"
                                        : userData.plan === "pro"
                                            ? "Alertas ilimitados + Histórico completo"
                                            : "Todos os recursos + API"}
                                </p>
                            </div>
                            {userData.plan === "free" ? (
                                <Link href="/planos">
                                    <Button>
                                        Fazer Upgrade
                                    </Button>
                                </Link>
                            ) : (
                                <form action={createCustomerPortal}>
                                    <Button variant="outline">
                                        Gerenciar Assinatura
                                    </Button>
                                </form>
                            )}
                        </div>

                        {userData.plan === "free" && (
                            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <h4 className="font-medium text-primary mb-2">Upgrade para Pro</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>Alertas de preço ilimitados</li>
                                    <li>Histórico completo (52 semanas)</li>
                                    <li>Exportação de dados CSV</li>
                                    <li>Sem anúncios</li>
                                </ul>
                                <p className="text-sm font-medium text-primary mt-3">
                                    Em breve - R$ 29/mês
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ações da Conta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <SignOutButton />
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-lg text-destructive">Zona de Perigo</CardTitle>
                        <CardDescription>
                            Ações irreversíveis que afetam permanentemente sua conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DeleteAccountButton />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

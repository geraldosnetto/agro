import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminStats } from "@/components/admin/AdminStats";
import { Users, Activity, BrainCircuit, AlertTriangle } from "lucide-react";

async function getAdminStats() {
    const [userCount, aiUsageToday, errorLogsToday, activeAlerts] = await Promise.all([
        prisma.user.count(),
        prisma.aIUsage.aggregate({
            _sum: { tokensUsed: true },
            where: {
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        }),
        prisma.atualizacaoLog.count({
            where: {
                status: "ERROR",
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        }),
        prisma.alertaUsuario.count({
            where: { ativo: true }
        })
    ]);

    return {
        userCount,
        tokensToday: aiUsageToday._sum.tokensUsed || 0,
        errorsToday: errorLogsToday,
        activeAlerts
    };
}

export default async function AdminDashboardPage() {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    const stats = await getAdminStats();

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStats
                    title="Total de Usuários"
                    value={stats.userCount}
                    description="Usuários cadastrados na plataforma"
                    icon={Users}
                />
                <AdminStats
                    title="Uso de AI (Hoje)"
                    value={stats.tokensToday.toLocaleString()}
                    description="Tokens consumidos hoje"
                    icon={BrainCircuit}
                />
                <AdminStats
                    title="Erros de Sincronização"
                    value={stats.errorsToday}
                    description="Falhas nas últimas 24h"
                    icon={AlertTriangle}
                />
                <AdminStats
                    title="Alertas Ativos"
                    value={stats.activeAlerts}
                    description="Monitoramentos de preço"
                    icon={Activity}
                />
            </div>

            {/* Placeholder for charts/tables */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h3 className="font-semibold">Atividade Recente</h3>
                        <p className="text-sm text-muted-foreground">Em breve: Gráfico de novos usuários</p>
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h3 className="font-semibold">Top Usuários de IA</h3>
                        <p className="text-sm text-muted-foreground">Em breve: Lista de power users</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

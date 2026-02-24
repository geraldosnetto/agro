import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { UsageChart } from "@/components/admin/UsageChart"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"

import { calculateAICosts } from "@/lib/ai/cost-calculator"

export default async function AIStatsPage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/")
    }

    // Get last 30 days of data
    const endDate = new Date()
    const startDate = subDays(endDate, 30)

    // 1. Get Chart Data (Daily Totals)
    const usageData = await prisma.aIUsage.groupBy({
        by: ['date'],
        _sum: {
            tokensUsed: true
        },
        where: {
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: {
            date: 'asc'
        }
    })

    const chartData = usageData.map(item => ({
        date: format(new Date(item.date), "dd/MM", { locale: ptBR }),
        tokens: item._sum.tokensUsed || 0
    }))

    // 2. Get Detailed Costs
    const costs = await calculateAICosts(startDate, endDate)

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics de IA</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <UsageChart data={chartData} />
                </div>
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold mb-4 text-xl">Custos e Consumo (30d)</h3>

                    <div className="space-y-6">
                        {/* Total Tokens */}
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground">Tokens Processados</span>
                            <span className="font-bold text-lg">
                                {usageData.reduce((acc, curr) => acc + (curr._sum.tokensUsed || 0), 0).toLocaleString()}
                            </span>
                        </div>

                        {/* Real Cost */}
                        <div className="flex items-center justify-between p-3 bg-green-50/50 border border-green-100 rounded-lg dark:bg-green-900/10 dark:border-green-900/30">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">Custo Calculado</span>
                                <span className="text-xs text-muted-foreground">Baseado no modelo usado</span>
                            </div>
                            <span className="font-bold text-2xl text-green-700 dark:text-green-400">
                                $ {costs.totalCost.toFixed(2)}
                            </span>
                        </div>

                        {/* Breakdown by Model */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Detalhamento por Modelo</h4>
                            {Object.entries(costs.byModel).map(([model, data]) => (
                                <div key={model} className="flex items-center justify-between text-sm py-1 border-b last:border-0 border-border/50">
                                    <span className="truncate max-w-[150px]" title={model}>
                                        {model.replace('claude-', '').replace('-latest', '').replace('-20250514', '')}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground text-xs">{data.tokens.toLocaleString()} toks</span>
                                        <span className="font-mono font-medium w-[60px] text-right">$ {data.cost.toFixed(3)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-md bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 mt-4">
                            <strong>Nota:</strong> A API da Anthropic não permite consulta de saldo programática.
                            Este valor é uma soma interna baseada no registro de uso dos nossos logs.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default async function LogsPage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/")
    }

    const logs = await prisma.atualizacaoLog.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: 100 // Limit to last 100 logs
    })

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Logs do Sistema</h2>
                    <p className="text-muted-foreground">
                        Histórico das últimas 100 sincronizações de dados.
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                </Button>
            </div>
            <DataTable columns={columns} data={logs} searchKey="fonte" />
        </div>
    )
}

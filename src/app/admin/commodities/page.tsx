import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"

export default async function CommoditiesPage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/")
    }

    const commodities = await prisma.commodity.findMany({
        orderBy: {
            nome: 'asc'
        }
    })

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Commodities</h2>
                    <p className="text-muted-foreground">
                        Gerencie os produtos disponíveis na plataforma.
                    </p>
                </div>
            </div>
            <DataTable columns={columns} data={commodities} searchKey="nome" />
        </div>
    )
}

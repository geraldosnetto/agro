import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DataTable } from "@/components/ui/data-table"
import { columns, UserColumn } from "./columns"
import { UserForm } from "./user-form"

async function getData(): Promise<UserColumn[]> {
    const users = await prisma.user.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Transform data to match UserColumn type if necessary
    // Prisma returns Role enum, we might want string
    return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt
    }))
}

export default async function UsersPage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/")
    }

    const data = await getData()

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
                    <p className="text-muted-foreground">
                        Gerencie os usuários e suas permissões.
                    </p>
                </div>
                <UserForm />
            </div>
            <DataTable columns={columns} data={data} searchKey="email" />
        </div>
    )
}

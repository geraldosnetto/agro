"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { toggleCommodityStatus } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type CommodityColumn = {
    id: string
    nome: string
    slug: string
    categoria: string
    unidade: string
    ativo: boolean
    updatedAt: Date
}

export const columns: ColumnDef<CommodityColumn>[] = [
    {
        accessorKey: "nome",
        header: "Nome",
        cell: ({ row }) => <span className="font-semibold">{row.getValue("nome")}</span>,
    },
    {
        accessorKey: "slug",
        header: "Slug",
    },
    {
        accessorKey: "categoria",
        header: "Categoria",
        cell: ({ row }) => <Badge variant="outline">{row.getValue("categoria")}</Badge>,
    },
    {
        accessorKey: "unidade",
        header: "Unidade",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("unidade")}</span>
    },
    {
        accessorKey: "ativo",
        header: "Ativo",
        cell: ({ row }) => {
            const isActive = row.original.ativo
            return (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={isActive}
                        onCheckedChange={async () => {
                            // Optimistic UI could be implemented here, but for admin panel simple toast is fine
                            const result = await toggleCommodityStatus(row.original.id, isActive)
                            if (result.success) {
                                toast.success(`Commodity ${isActive ? 'desativada' : 'ativada'} com sucesso`)
                            } else {
                                toast.error("Erro ao atualizar status")
                            }
                        }}
                    />
                    <span className="text-xs text-muted-foreground">{isActive ? 'Sim' : 'Não'}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "updatedAt",
        header: "Última Atualização",
        cell: ({ row }) => {
            return format(new Date(row.getValue("updatedAt")), "dd/MM/yyyy")
        }
    },
]

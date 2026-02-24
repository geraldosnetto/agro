"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export type LogColumn = {
    id: string
    fonte: string
    status: string
    mensagem: string | null
    registros: number
    duracao: number | null
    createdAt: Date
}

export const columns: ColumnDef<LogColumn>[] = [
    {
        accessorKey: "fonte",
        header: "Fonte",
        cell: ({ row }) => <span className="font-semibold">{row.getValue("fonte")}</span>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "SUCCESS" ? "default" : "destructive"}>
                    {status}
                </Badge>
            )
        }
    },
    {
        accessorKey: "registros",
        header: "Registros",
    },
    {
        accessorKey: "duracao",
        header: "Duração (ms)",
        cell: ({ row }) => {
            const val = row.getValue("duracao")
            return val ? val + "ms" : "-"
        }
    },
    {
        accessorKey: "mensagem",
        header: "Mensagem",
        cell: ({ row }) => {
            return <span className="text-muted-foreground text-xs truncate max-w-[200px] block" title={row.getValue("mensagem") || ""}>{row.getValue("mensagem")}</span>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ row }) => {
            return format(new Date(row.getValue("createdAt")), "dd/MM HH:mm", { locale: ptBR })
        }
    },
]

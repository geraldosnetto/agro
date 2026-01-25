"use client";

import { useState } from "react";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
    commoditySlug: string;
    size?: "sm" | "default" | "lg";
}

const periods = [
    { value: "7", label: "Últimos 7 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "90", label: "Últimos 90 dias" },
    { value: "365", label: "Último ano" },
    { value: "all", label: "Todo o histórico" },
];

export function ExportButton({ commoditySlug, size = "default" }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = async (period: string) => {
        setLoading(true);

        try {
            const response = await fetch(`/api/cotacoes/${commoditySlug}/export?period=${period}`);

            if (!response.ok) {
                throw new Error("Erro ao exportar");
            }

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get("Content-Disposition");
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || `${commoditySlug}-cotacoes.csv`;

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Erro ao exportar:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={size} disabled={loading}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Baixar CSV
                    <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Selecione o período</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {periods.map((period) => (
                    <DropdownMenuItem
                        key={period.value}
                        onClick={() => handleExport(period.value)}
                    >
                        {period.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

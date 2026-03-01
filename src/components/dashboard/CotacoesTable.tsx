"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import { CotacaoCategoria } from "./CotacaoCard";
import { getCategoriaConfig } from "@/lib/categories";
import { FavoriteButton } from "@/components/FavoriteButton";

interface CotacaoItem {
    slug: string;
    nome: string;
    valor: number;
    unidade: string;
    variacao: number;
    categoria: CotacaoCategoria;
    praca: string;
    dataAtualizacao: string;
    isFavorite: boolean;
}

interface CotacoesTableProps {
    data: CotacaoItem[];
}

export function CotacoesTable({ data }: CotacoesTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Praça</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                        <TableHead className="text-right text-muted-foreground whitespace-nowrap">Última Atualização</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                Nenhuma cotação encontrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => {
                            const config = getCategoriaConfig(item.categoria);
                            const isPositive = item.variacao > 0;
                            const isNegative = item.variacao < 0;
                            const isNeutral = item.variacao === 0;

                            return (
                                <TableRow key={`${item.nome}-${item.praca}`}>
                                    <TableCell>
                                        <FavoriteButton
                                            commoditySlug={item.slug}
                                            size="sm"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {item.nome}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`font-normal ${config.badgeClassName}`}>
                                            {config.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                                        {item.praca}
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <span className="font-semibold text-base">
                                            R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1">
                                            / {item.unidade}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className={`inline-flex items-center justify-end font-medium text-sm w-full ${isPositive ? "text-[var(--positive)]" :
                                            isNegative ? "text-[var(--negative)]" :
                                                "text-muted-foreground"
                                            }`}>
                                            {isPositive ? <ArrowUpIcon className="mr-1 h-3 w-3" /> :
                                                isNegative ? <ArrowDownIcon className="mr-1 h-3 w-3" /> :
                                                    <MinusIcon className="mr-1 h-3 w-3" />}
                                            {Math.abs(item.variacao).toFixed(2)}%
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm whitespace-nowrap">
                                        {item.dataAtualizacao}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

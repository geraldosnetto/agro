"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UsageChartProps {
    data: {
        date: string
        tokens: number
    }[]
}

export function UsageChart({ data }: UsageChartProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Consumo de Tokens (Últimos 30 dias)</CardTitle>
                <CardDescription>
                    Visualização diária do uso de IA na plataforma.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                            dataKey="tokens"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}


'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Line, Bar } from 'recharts';
import { WeatherData } from '@/lib/data-sources/weather';

interface ForecastChartProps {
    data: WeatherData['daily'];
}

export function ForecastChart({ data }: ForecastChartProps) {
    // Formatar dados para o gráfico
    const chartData = data.time.map((date, index) => {
        const d = new Date(date);
        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayNum = d.getDate();

        return {
            date: `${dayName}, ${dayNum}`,
            max: data.tempMax[index],
            min: data.tempMin[index],
            rain: data.precipitationProb[index],
            rainSum: data.precipitationSum[index],
        };
    });

    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        unit="°C"
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        unit="mm"
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px"
                        }}
                    />
                    <Legend />

                    {/* Barras de Chuva */}
                    <Bar
                        yAxisId="right"
                        dataKey="rainSum"
                        name="Chuva (mm)"
                        fill="var(--primary)"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />

                    {/* Área de Temperatura */}
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="max"
                        name="Máxima"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTemp)"
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="min"
                        name="Mínima"
                        stroke="var(--chart-4)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

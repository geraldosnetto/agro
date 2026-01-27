
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { profitabilitySchema, type CalculatorInputs } from '@/lib/calculators/profitability';
import { DollarSign, Sprout, TrendingUp } from 'lucide-react';

interface CalculatorFormProps {
    onCalculate: (data: CalculatorInputs) => void;
}

export function CalculatorForm({ onCalculate }: CalculatorFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<CalculatorInputs>({
        resolver: zodResolver(profitabilitySchema),
        defaultValues: {
            area: 100,
            expectedYield: 60,
            salePrice: 130,
            seedsCost: 800,
            fertilizerCost: 2500,
            pesticideCost: 1200,
            operationCost: 800,
            adminCost: 200,
            otherCost: 0
        }
    });

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-primary" />
                    Parâmetros da Safra
                </CardTitle>
                <CardDescription>
                    Insira os dados da sua produção estimada.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onCalculate)} className="space-y-6">

                    {/* Dados Gerais */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Produção e Venda
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="area">Área Total (ha)</Label>
                                <Input
                                    id="area"
                                    type="number"
                                    step="0.1"
                                    {...register('area', { valueAsNumber: true })}
                                />
                                {errors.area && <span className="text-destructive text-xs">{errors.area.message}</span>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expectedYield">Produtividade (sc/ha)</Label>
                                <Input
                                    id="expectedYield"
                                    type="number"
                                    step="0.1"
                                    {...register('expectedYield', { valueAsNumber: true })}
                                />
                                {errors.expectedYield && <span className="text-destructive text-xs">{errors.expectedYield.message}</span>}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="salePrice">Preço de Venda Esperado (R$/sc)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="salePrice"
                                        className="pl-9"
                                        type="number"
                                        step="0.01"
                                        {...register('salePrice', { valueAsNumber: true })}
                                    />
                                </div>
                                {errors.salePrice && <span className="text-destructive text-xs">{errors.salePrice.message}</span>}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Custos */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Custos por Hectare (R$/ha)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="seedsCost">Sementes</Label>
                                <Input id="seedsCost" type="number" step="0.01" {...register('seedsCost', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fertilizerCost">Fertilizantes</Label>
                                <Input id="fertilizerCost" type="number" step="0.01" {...register('fertilizerCost', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pesticideCost">Defensivos</Label>
                                <Input id="pesticideCost" type="number" step="0.01" {...register('pesticideCost', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="operationCost">Operacional</Label>
                                <Input id="operationCost" type="number" step="0.01" {...register('operationCost', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adminCost">Administrativo</Label>
                                <Input id="adminCost" type="number" step="0.01" {...register('adminCost', { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="otherCost">Outros</Label>
                                <Input id="otherCost" type="number" step="0.01" {...register('otherCost', { valueAsNumber: true })} />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg">Calculadora Rentabilidade</Button>
                </form>
            </CardContent>
        </Card>
    );
}

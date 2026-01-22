import { z } from 'zod';
import { Categoria } from '@prisma/client';

// Schema para validação do parâmetro days no histórico
export const HistoricoQuerySchema = z.object({
    days: z.coerce
        .number()
        .int()
        .min(1, 'Período mínimo é 1 dia')
        .max(365, 'Período máximo é 365 dias')
        .default(30),
});

// Schema para validação do slug de commodity
export const SlugSchema = z
    .string()
    .min(1, 'Slug é obrigatório')
    .max(50, 'Slug muito longo')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens');

// Schema para validação da categoria
export const CategoriaSchema = z.nativeEnum(Categoria).optional();

// Schema para query de cotações
export const CotacoesQuerySchema = z.object({
    categoria: CategoriaSchema,
});

// Schema para resposta de histórico (validação de dados da API)
export const ChartDataSchema = z.object({
    date: z.string(),
    valor: z.number(),
});

export const ChartDataArraySchema = z.array(ChartDataSchema);

// Types inferidos dos schemas
export type HistoricoQuery = z.infer<typeof HistoricoQuerySchema>;
export type CotacoesQuery = z.infer<typeof CotacoesQuerySchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;

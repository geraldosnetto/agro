/**
 * Configuração centralizada de categorias de commodities.
 * 
 * Usado para labels, cores de badges e accent bars ao longo da aplicação.
 * A chave é a forma lowercase retornada por formatarCategoria().
 */

export type CategoriaKey = 'graos' | 'pecuaria' | 'sucroenergetico' | 'fibras' | 'peixe' | 'outros';

interface CategoriaConfig {
    /** Label para exibição */
    label: string;
    /** Classes do badge (bg, text, border) */
    badgeClassName: string;
    /** Classe da barra decorativa (accent bar no topo dos cards) */
    accentClassName: string;
}

export const CATEGORIA_CONFIG: Record<CategoriaKey, CategoriaConfig> = {
    graos: {
        label: "Grãos",
        badgeClassName: "bg-chart-1/10 text-chart-1 border-chart-1/20",
        accentClassName: "bg-chart-1",
    },
    pecuaria: {
        label: "Pecuária",
        badgeClassName: "bg-chart-2/10 text-chart-2 border-chart-2/20",
        accentClassName: "bg-chart-2",
    },
    sucroenergetico: {
        label: "Sucroenergético",
        badgeClassName: "bg-chart-3/10 text-chart-3 border-chart-3/20",
        accentClassName: "bg-chart-3",
    },
    fibras: {
        label: "Fibras",
        badgeClassName: "bg-chart-4/10 text-chart-4 border-chart-4/20",
        accentClassName: "bg-chart-4",
    },
    peixe: {
        label: "Peixe",
        badgeClassName: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
        accentClassName: "bg-cyan-500",
    },
    outros: {
        label: "Outros",
        badgeClassName: "bg-chart-5/10 text-chart-5 border-chart-5/20",
        accentClassName: "bg-chart-5",
    },
};

/**
 * Mapeamento de chave uppercase (vinda do banco) → label.
 * Para uso em contextos onde a categoria vem em UPPERCASE do Prisma.
 */
export const CATEGORIA_LABELS_UPPER: Record<string, string> = {
    GRAOS: "Grãos",
    PECUARIA: "Pecuária",
    SUCROENERGETICO: "Sucroenergético",
    FIBRAS: "Fibras",
    PEIXE: "Peixe",
    OUTROS: "Outros",
};

/**
 * Retorna a config para uma categoria (aceita lowercase ou uppercase).
 */
export function getCategoriaConfig(categoria: string): CategoriaConfig {
    const key = categoria.toLowerCase() as CategoriaKey;
    return CATEGORIA_CONFIG[key] ?? CATEGORIA_CONFIG.outros;
}

/**
 * Retorna apenas o label formatado para uma categoria.
 */
export function getCategoriaLabel(categoria: string): string {
    return getCategoriaConfig(categoria).label;
}

import { Unidade, Categoria } from '@prisma/client';

/**
 * Converte o enum de unidade do banco para formato de display
 */
export function formatarUnidade(unidade: Unidade | string): string {
    const map: Record<string, string> = {
        'SACA_60KG': 'sc 60kg',
        'ARROBA': '@',
        'LITRO': 'L',
        'TONELADA': 'ton',
        'KG': 'kg',
        'SACA_50KG': 'sc 50kg',
        'DUZIA': 'dz',
        'CABECA': 'cab'
    };
    return map[unidade] || unidade;
}

/**
 * Converte categoria para lowercase (formato do componente)
 */
export function formatarCategoria(categoria: Categoria | string): string {
    return categoria.toLowerCase();
}

/**
 * Formata valor monetário em BRL
 */
export function formatarMoeda(valor: number, decimais = 2): string {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais,
    });
}

/**
 * Formata variação percentual com sinal
 */
export function formatarVariacao(variacao: number): string {
    const sinal = variacao >= 0 ? '+' : '';
    return `${sinal}${variacao.toFixed(2)}%`;
}

/**
 * Formata data para exibição
 */
export function formatarData(data: Date | string, formato: 'curto' | 'longo' = 'curto'): string {
    const d = typeof data === 'string' ? new Date(data) : data;

    if (formato === 'curto') {
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}


// Praça names per commodity (based on CEPEA table structure)
// The first item in the array is considered the "Primary" or "Reference" praça.
export const PRACA_NAMES: Record<string, string[]> = {
    // Grãos
    'soja': ['Paranaguá/PR', 'Porto Base'],
    'milho': ['ESALQ/BM&FBovespa'],
    'trigo': ['Paraná', 'Rio Grande do Sul'],
    'arroz': ['RS/IRGA'],
    'feijao-carioca': ['São Paulo'],
    'feijao-preto': ['São Paulo'],
    // Pecuária
    'boi-gordo': ['Indicador CEPEA', 'Média SP', 'A Prazo'],
    'bezerro': ['Mato Grosso do Sul', 'São Paulo'],
    'suino': ['Regional (MG/PR/RS)', 'Carcaça SP'],
    'frango': ['Congelado SP'],
    'frango-resfriado': ['Resfriado SP'],
    'leite': ['Brasil'],
    'ovos': ['São Paulo'],
    // Café
    'cafe-arabica': ['Indicador CEPEA'],
    'cafe-robusta': ['Indicador Robusta'],
    // Açúcar
    'acucar-cristal': ['Cristal SP'],
    'acucar-vhp': ['VHP Exportação'],
    // Algodão
    'algodao': ['Indicador CEPEA'],
    // Citros
    'laranja': ['Média SP'],
    // Mandioca
    'mandioca': ['Média SP']
};

export function getPrimaryPraca(slug: string): string | null {
    const pracas = PRACA_NAMES[slug];
    return pracas && pracas.length > 0 ? pracas[0] : null;
}

export function getAllPracas(slug: string): string[] {
    return PRACA_NAMES[slug] || [];
}

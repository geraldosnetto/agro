
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
    'leite': ['RS', 'SC', 'PR', 'SP', 'MG', 'GO', 'BA', 'BRASIL', 'RJ', 'ES'],
    'ovos': ['São Paulo'],
    // Café
    'cafe-arabica': ['Indicador CEPEA'],
    'cafe-robusta': ['Indicador Robusta'],
    // Açúcar
    'acucar-cristal': ['Cristal SP'],
    'acucar-vhp': ['Mercado Externo SP'],
    'acucar-refinado': ['Refinado Amorfo SP'],
    'acucar-empacotado': ['Cristal Empacotado SP'],
    'acucar-interno-al': ['Mercado Interno AL'],
    'acucar-interno-pb': ['Mercado Interno PB'],
    'acucar-interno-pe': ['Mercado Interno PE'],
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

export function extrairUF(praca: string): string {
    if (!praca) return 'BR';
    const p = praca.toUpperCase();
    if (p.includes('/PR') || p.includes('PARANÁ') || p.includes('PARANA')) return 'PR';
    if (p.includes('SP') || p.includes('SÃO PAULO') || p.includes('SAO PAULO') || p.includes('PAULISTA') || p.includes('ESALQ')) return 'SP';
    if (p.includes('RS') || p.includes('RIO GRANDE DO SUL') || p.includes('GAÚCHO')) return 'RS';
    if (p.includes('MS') || p.includes('MATO GROSSO DO SUL')) return 'MS';
    if (p.includes('MT') || p.includes('MATO GROSSO')) return 'MT';
    if (p.includes('MG') || p.includes('MINAS GERAIS') || p.includes('MINEIRO')) return 'MG';
    if (p.includes('GO') || p.includes('GOIÁS') || p.includes('GOIAS')) return 'GO';
    if (p.includes('BA') || p.includes('BAHIA')) return 'BA';
    if (p.includes('SC') || p.includes('SANTA CATARINA')) return 'SC';

    // Default to BR for national indicators
    return 'BR';
}

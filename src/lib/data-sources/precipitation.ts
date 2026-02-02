/**
 * Cliente para dados de precipitação regional do Brasil
 * Usa Open-Meteo para buscar previsão de chuva por região agrícola
 */

// Coordenadas representativas por estado (centros agrícolas importantes)
export const REGIONAL_POINTS: Array<{
    uf: string;
    name: string;
    lat: number;
    lon: number;
    region: string;
}> = [
    // Norte
    { uf: 'RO', name: 'Porto Velho', lat: -8.76, lon: -63.90, region: 'Norte' },
    { uf: 'AC', name: 'Rio Branco', lat: -9.97, lon: -67.81, region: 'Norte' },
    { uf: 'AM', name: 'Manaus', lat: -3.10, lon: -60.02, region: 'Norte' },
    { uf: 'RR', name: 'Boa Vista', lat: 2.82, lon: -60.67, region: 'Norte' },
    { uf: 'PA', name: 'Belém', lat: -1.45, lon: -48.50, region: 'Norte' },
    { uf: 'AP', name: 'Macapá', lat: 0.03, lon: -51.05, region: 'Norte' },
    { uf: 'TO', name: 'Palmas', lat: -10.24, lon: -48.35, region: 'Norte' },

    // Nordeste
    { uf: 'MA', name: 'Balsas', lat: -7.53, lon: -46.03, region: 'Nordeste' }, // MATOPIBA
    { uf: 'PI', name: 'Uruçuí', lat: -7.23, lon: -44.55, region: 'Nordeste' }, // MATOPIBA
    { uf: 'CE', name: 'Fortaleza', lat: -3.71, lon: -38.54, region: 'Nordeste' },
    { uf: 'RN', name: 'Natal', lat: -5.79, lon: -35.21, region: 'Nordeste' },
    { uf: 'PB', name: 'João Pessoa', lat: -7.11, lon: -34.86, region: 'Nordeste' },
    { uf: 'PE', name: 'Recife', lat: -8.05, lon: -34.88, region: 'Nordeste' },
    { uf: 'AL', name: 'Maceió', lat: -9.66, lon: -35.74, region: 'Nordeste' },
    { uf: 'SE', name: 'Aracaju', lat: -10.91, lon: -37.07, region: 'Nordeste' },
    { uf: 'BA', name: 'Barreiras', lat: -12.15, lon: -44.99, region: 'Nordeste' }, // MATOPIBA

    // Centro-Oeste
    { uf: 'MT', name: 'Sorriso', lat: -12.54, lon: -55.72, region: 'Centro-Oeste' }, // Capital da Soja
    { uf: 'MS', name: 'Dourados', lat: -22.22, lon: -54.80, region: 'Centro-Oeste' },
    { uf: 'GO', name: 'Rio Verde', lat: -17.79, lon: -50.91, region: 'Centro-Oeste' },
    { uf: 'DF', name: 'Brasília', lat: -15.79, lon: -47.88, region: 'Centro-Oeste' },

    // Sudeste
    { uf: 'MG', name: 'Uberaba', lat: -19.74, lon: -47.93, region: 'Sudeste' }, // Triângulo Mineiro
    { uf: 'ES', name: 'Vitória', lat: -20.29, lon: -40.29, region: 'Sudeste' },
    { uf: 'RJ', name: 'Campos', lat: -21.75, lon: -41.32, region: 'Sudeste' },
    { uf: 'SP', name: 'Ribeirão Preto', lat: -21.17, lon: -47.81, region: 'Sudeste' }, // Cana

    // Sul
    { uf: 'PR', name: 'Cascavel', lat: -24.95, lon: -53.46, region: 'Sul' },
    { uf: 'SC', name: 'Chapecó', lat: -27.09, lon: -52.62, region: 'Sul' },
    { uf: 'RS', name: 'Passo Fundo', lat: -28.26, lon: -52.40, region: 'Sul' }, // Trigo/Soja
];

export interface RegionalPrecipitation {
    uf: string;
    name: string;
    region: string;
    lat: number;
    lon: number;
    daily: {
        time: string[];
        precipitation: number[];  // mm por dia
        precipitationProbability: number[];
    };
    accumulated7Days: number;
}

export interface PrecipitationForecast {
    generatedAt: string;
    regions: RegionalPrecipitation[];
    summary: {
        highestAccumulation: { uf: string; name: string; value: number };
        lowestAccumulation: { uf: string; name: string; value: number };
        nationalAverage: number;
    };
}

/**
 * Busca previsão de precipitação para um ponto específico
 */
async function fetchPointPrecipitation(
    lat: number,
    lon: number
): Promise<{ time: string[]; precipitation: number[]; precipitationProbability: number[] } | null> {
    try {
        const params = new URLSearchParams({
            latitude: lat.toString(),
            longitude: lon.toString(),
            daily: 'precipitation_sum,precipitation_probability_max',
            timezone: 'America/Sao_Paulo',
            forecast_days: '7'
        });

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
            { next: { revalidate: 3600 } } // Cache 1 hora
        );

        if (!response.ok) {
            throw new Error(`Open-Meteo error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            time: data.daily.time,
            precipitation: data.daily.precipitation_sum,
            precipitationProbability: data.daily.precipitation_probability_max,
        };
    } catch (error) {
        console.error(`Error fetching precipitation for ${lat},${lon}:`, error);
        return null;
    }
}

/**
 * Busca previsão de precipitação para todas as regiões do Brasil
 * Usa paralelização para buscar todos os pontos simultaneamente
 */
export async function fetchRegionalPrecipitation(): Promise<PrecipitationForecast> {
    const results = await Promise.allSettled(
        REGIONAL_POINTS.map(async (point) => {
            const data = await fetchPointPrecipitation(point.lat, point.lon);
            if (!data) return null;

            const accumulated7Days = data.precipitation.reduce((sum, val) => sum + (val || 0), 0);

            return {
                uf: point.uf,
                name: point.name,
                region: point.region,
                lat: point.lat,
                lon: point.lon,
                daily: data,
                accumulated7Days: Math.round(accumulated7Days * 10) / 10,
            };
        })
    );

    const regions = results
        .filter((r): r is PromiseFulfilledResult<RegionalPrecipitation | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((r): r is RegionalPrecipitation => r !== null);

    // Calcular sumário
    const sortedByAccumulation = [...regions].sort((a, b) => b.accumulated7Days - a.accumulated7Days);
    const totalAccumulation = regions.reduce((sum, r) => sum + r.accumulated7Days, 0);

    return {
        generatedAt: new Date().toISOString(),
        regions,
        summary: {
            highestAccumulation: sortedByAccumulation[0]
                ? { uf: sortedByAccumulation[0].uf, name: sortedByAccumulation[0].name, value: sortedByAccumulation[0].accumulated7Days }
                : { uf: '-', name: '-', value: 0 },
            lowestAccumulation: sortedByAccumulation[sortedByAccumulation.length - 1]
                ? { uf: sortedByAccumulation[sortedByAccumulation.length - 1].uf, name: sortedByAccumulation[sortedByAccumulation.length - 1].name, value: sortedByAccumulation[sortedByAccumulation.length - 1].accumulated7Days }
                : { uf: '-', name: '-', value: 0 },
            nationalAverage: regions.length > 0 ? Math.round((totalAccumulation / regions.length) * 10) / 10 : 0,
        }
    };
}

/**
 * Agrupa dados de precipitação por região (Norte, Nordeste, etc)
 */
export function groupByRegion(data: PrecipitationForecast): Record<string, RegionalPrecipitation[]> {
    return data.regions.reduce((acc, region) => {
        if (!acc[region.region]) {
            acc[region.region] = [];
        }
        acc[region.region].push(region);
        return acc;
    }, {} as Record<string, RegionalPrecipitation[]>);
}

/**
 * Retorna a escala de cores para precipitação (similar ao mapa do INMET)
 * 0mm = bege claro, 10mm = verde, 50mm = amarelo, 100mm = laranja, 200mm+ = vermelho/roxo
 */
export function getPrecipitationColor(mm: number): string {
    if (mm <= 1) return '#f5f5dc';      // bege - sem chuva
    if (mm <= 10) return '#90EE90';     // verde claro
    if (mm <= 20) return '#32CD32';     // verde
    if (mm <= 30) return '#228B22';     // verde escuro
    if (mm <= 50) return '#FFD700';     // amarelo
    if (mm <= 70) return '#FFA500';     // laranja
    if (mm <= 100) return '#FF4500';    // laranja escuro
    if (mm <= 150) return '#FF0000';    // vermelho
    if (mm <= 200) return '#8B0000';    // vermelho escuro
    return '#800080';                    // roxo - chuva extrema
}

/**
 * Retorna descrição textual do volume de chuva
 */
export function getPrecipitationDescription(mm: number): string {
    if (mm <= 1) return 'Sem chuva';
    if (mm <= 10) return 'Chuva fraca';
    if (mm <= 30) return 'Chuva moderada';
    if (mm <= 50) return 'Chuva forte';
    if (mm <= 100) return 'Chuva muito forte';
    return 'Chuva extrema';
}

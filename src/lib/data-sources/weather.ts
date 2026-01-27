
/**
 * Cliente da API OpenMeteo para Previsão do Tempo
 * https://open-meteo.com/
 */

export interface WeatherData {
    current: {
        temperature: number;
        humidity: number;
        windSpeed: number;
        conditionCode: number;
        isDay: boolean; // 1 = dia, 0 = noite
    };
    daily: {
        time: string[];
        tempMax: number[];
        tempMin: number[];
        precipitationSum: number[];
        precipitationProb: number[];
    };
}

export interface City {
    id: string; // "lat,lon" for search results or specific ID for preset
    name: string;
    state: string;
    lat: number;
    lon: number;
}

// Principais polos agrícolas do Brasil
export const AGRICULTURAL_CITIES: City[] = [
    { id: 'sorriso-mt', name: 'Sorriso', state: 'MT', lat: -12.54, lon: -55.72 }, // Soja/Milho
    { id: 'rio-verde-go', name: 'Rio Verde', state: 'GO', lat: -17.79, lon: -50.91 }, // Grãos
    { id: 'londrina-pr', name: 'Londrina', state: 'PR', lat: -23.31, lon: -51.16 }, // Diversos
    { id: 'cascavel-pr', name: 'Cascavel', state: 'PR', lat: -24.95, lon: -53.46 }, // Grãos
    { id: 'barreiras-ba', name: 'Barreiras', state: 'BA', lat: -12.15, lon: -44.99 }, // Matopiba (Soja/Algodão)
    { id: 'balsas-ma', name: 'Balsas', state: 'MA', lat: -7.53, lon: -46.03 }, // Matopiba
    { id: 'dourados-ms', name: 'Dourados', state: 'MS', lat: -22.22, lon: -54.80 }, // Grãos
    { id: 'uberaba-mg', name: 'Uberaba', state: 'MG', lat: -19.74, lon: -47.93 }, // Pecuária
    { id: 'ribeirao-preto-sp', name: 'Ribeirão Preto', state: 'SP', lat: -21.17, lon: -47.81 }, // Cana
    { id: 'passo-fundo-rs', name: 'Passo Fundo', state: 'RS', lat: -28.26, lon: -52.40 }, // Trigo/Soja
];

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
        const params = new URLSearchParams({
            latitude: lat.toString(),
            longitude: lon.toString(),
            current: 'temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
            timezone: 'America/Sao_Paulo',
            forecast_days: '7'
        });

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`OpenMeteo API Error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            current: {
                temperature: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                windSpeed: data.current.wind_speed_10m,
                conditionCode: data.current.weather_code,
                isDay: !!data.current.is_day,
            },
            daily: {
                time: data.daily.time,
                tempMax: data.daily.temperature_2m_max,
                tempMin: data.daily.temperature_2m_min,
                precipitationSum: data.daily.precipitation_sum,
                precipitationProb: data.daily.precipitation_probability_max,
            }
        };

    } catch (error) {
        console.error('Error fetching weather:', error);
        return null; // Retorna null em caso de erro para não quebrar a UI
    }
}

interface GeocodingResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    admin1: string; // Estado
    country_code: string;
}

export async function searchCities(query: string): Promise<City[]> {
    if (!query || query.length < 3) return [];

    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`
        );
        const data = await response.json();

        if (!data.results) return [];

        return data.results
            .filter((item: GeocodingResult) => item.country_code === 'BR') // Filtrar apenas Brasil por enquanto
            .map((item: GeocodingResult) => ({
                id: `${item.latitude},${item.longitude}`, // ID único baseado na coord
                name: item.name,
                state: item.admin1 || '',
                lat: item.latitude,
                lon: item.longitude
            }));
    } catch (error) {
        console.error('Error searching cities:', error);
        return [];
    }
}

// Mapa de códigos WMO para descrições em PT-BR
export const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
    0: { label: 'Céu Limpo', icon: 'Sun' },
    1: { label: 'Principalmente Limpo', icon: 'CloudSun' },
    2: { label: 'Parcialmente Nublado', icon: 'CloudSun' },
    3: { label: 'Nublado', icon: 'Cloud' },
    45: { label: 'Nevoeiro', icon: 'AlignJustify' }, // Fog
    48: { label: 'Nevoeiro com Geada', icon: 'AlignJustify' },
    51: { label: 'Garoa Leve', icon: 'CloudDrizzle' },
    53: { label: 'Garoa Moderada', icon: 'CloudDrizzle' },
    55: { label: 'Garoa Densa', icon: 'CloudDrizzle' },
    61: { label: 'Chuva Leve', icon: 'CloudRain' },
    63: { label: 'Chuva Moderada', icon: 'CloudRain' },
    65: { label: 'Chuva Forte', icon: 'CloudRain' },
    71: { label: 'Neve Leve', icon: 'Snowflake' },
    80: { label: 'Pancadas de Chuva Leves', icon: 'CloudRain' },
    81: { label: 'Pancadas de Chuva Moderadas', icon: 'CloudRain' },
    82: { label: 'Pancadas de Chuva Fortes', icon: 'CloudLightning' },
    95: { label: 'Tempestade', icon: 'CloudLightning' },
    96: { label: 'Tempestade com Granizo Leve', icon: 'CloudLightning' },
    99: { label: 'Tempestade com Granizo Forte', icon: 'CloudLightning' },
};

export function getWeatherDescription(code: number) {
    return WEATHER_CODES[code] || { label: 'Desconhecido', icon: 'HelpCircle' };
}

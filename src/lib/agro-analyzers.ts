
import { WeatherData } from "@/lib/data-sources/weather";

export interface AgroInsight {
    id: string;
    type: 'good' | 'warning' | 'bad' | 'neutral';
    title: string;
    description: string;
    icon: 'spray' | 'fungus' | 'tractor' | 'sun' | 'water' | 'frost' | 'drought';
}

/**
 * Analisa as condições climáticas e gera insights agronômicos
 */
export function analyzeWeatherConditions(weather: WeatherData): AgroInsight[] {
    const insights: AgroInsight[] = [];

    const { current, daily } = weather;
    const temp = current.temperature;
    const wind = current.windSpeed;
    const humidity = current.humidity;
    const rainToday = daily.precipitationSum[0];
    const rainProb = daily.precipitationProb[0];

    // Temperaturas mínimas dos próximos dias
    const minTemps = daily.tempMin || [];
    const rainSums = daily.precipitationSum || [];

    // 1. Condições de Pulverização (Spraying)
    // Ideal: Vento 3-10km/h, Temp < 30°C, Umidade > 50%, Sem chuva
    let sprayStatus: AgroInsight['type'] = 'neutral';
    let sprayMsg = "";

    if (rainToday > 0.1 || rainProb > 60) {
        sprayStatus = 'bad';
        sprayMsg = "Risco de chuva. Evite aplicações para não perder o produto.";
    } else if (wind > 10) {
        sprayStatus = 'bad';
        sprayMsg = `Vento forte (${wind} km/h). Alto risco de deriva.`;
    } else if (wind < 3) {
        sprayStatus = 'warning';
        sprayMsg = "Vento muito calmo. Risco de inversão térmica (gotas não descem).";
    } else if (temp > 30) {
        sprayStatus = 'warning';
        sprayMsg = "Temperatura alta. Risco de evaporação rápida da gota.";
    } else if (humidity < 50) {
        sprayStatus = 'warning';
        sprayMsg = "Umidade baixa. Risco de evaporação.";
    } else {
        sprayStatus = 'good';
        sprayMsg = "Condições ideais: Vento moderado, umidade boa e sem chuva.";
    }

    insights.push({
        id: 'spray',
        type: sprayStatus,
        title: 'Pulverização',
        description: sprayMsg,
        icon: 'spray'
    });

    // 2. Risco de Doenças Fúngicas (Fungal Risk)
    // Alta umidade + Calor = Banquete para fungos (Ferrugem, Manchas)
    if (humidity > 85 && temp > 25) {
        insights.push({
            id: 'fungus',
            type: 'bad',
            title: 'Risco de Doenças Fúngicas',
            description: `Alta umidade (${humidity}%) e calor favorecem ferrugem e manchas foliares. Monitore a lavoura.`,
            icon: 'fungus'
        });
    } else if (humidity > 90) {
        insights.push({
            id: 'fungus',
            type: 'warning',
            title: 'Alerta de Umidade Alta',
            description: "Umidade excessiva favorece patógenos. Fique atento.",
            icon: 'fungus'
        });
    }

    // 3. Condições de Colheita (Harvest)
    // Precisa de tempo seco
    if (rainToday > 5) {
        insights.push({
            id: 'harvest',
            type: 'bad',
            title: 'Colheita',
            description: "Solo úmido e chuva impedem colheita mecanizada eficiente.",
            icon: 'tractor'
        });
    } else if (rainToday === 0 && humidity < 70) {
        insights.push({
            id: 'harvest',
            type: 'good',
            title: 'Colheita',
            description: "Tempo seco favorece a colheita e secagem natural dos grãos.",
            icon: 'tractor'
        });
    }

    // 4. Estresse Térmico
    if (temp > 35) {
        insights.push({
            id: 'heat',
            type: 'bad',
            title: 'Estresse Térmico',
            description: "Calor extremo pode afetar o desenvolvimento das plantas e bem-estar animal.",
            icon: 'sun'
        });
    }

    // 5. Alerta de Geada (Frost Warning)
    // Verifica temperaturas mínimas nos próximos 3 dias
    const frostDays: number[] = [];
    for (let i = 0; i < Math.min(3, minTemps.length); i++) {
        if (minTemps[i] <= 3) {
            frostDays.push(i);
        }
    }

    if (frostDays.length > 0) {
        const lowestTemp = Math.min(...frostDays.map(d => minTemps[d]));
        const dayText = frostDays[0] === 0 ? 'hoje' : frostDays[0] === 1 ? 'amanhã' : `em ${frostDays[0]} dias`;

        insights.push({
            id: 'frost',
            type: lowestTemp <= 0 ? 'bad' : 'warning',
            title: 'Alerta de Geada',
            description: `Risco de geada ${dayText} (mín: ${lowestTemp.toFixed(1)}°C). Proteja mudas e culturas sensíveis.`,
            icon: 'frost'
        });
    }

    // 6. Alerta de Seca (Drought Warning)
    // Verifica dias consecutivos sem chuva significativa
    let dryDays = 0;
    for (let i = 0; i < rainSums.length; i++) {
        if (rainSums[i] < 1) {
            dryDays++;
        } else {
            break;
        }
    }

    if (dryDays >= 7) {
        insights.push({
            id: 'drought',
            type: dryDays >= 10 ? 'bad' : 'warning',
            title: 'Déficit Hídrico',
            description: `${dryDays} dias sem chuva significativa prevista. Considere irrigação para culturas em período crítico.`,
            icon: 'drought'
        });
    }

    return insights;
}

/**
 * Calcula o acúmulo de chuva em diferentes períodos
 */
export function calculateRainfallAccumulation(weather: WeatherData): {
    last7Days: number;
    next7Days: number;
    total14Days: number;
} {
    const rainSums = weather.daily.precipitationSum || [];

    // Assume que o índice 0 é hoje
    // Últimos 7 dias: índices 0 a 6 (se disponíveis)
    // Próximos 7 dias: índices 0 a 6 (previsão)

    const next7Days = rainSums.slice(0, 7).reduce((a, b) => a + b, 0);

    return {
        last7Days: 0, // Não temos dados passados na API atual
        next7Days: Math.round(next7Days * 10) / 10,
        total14Days: Math.round(next7Days * 10) / 10,
    };
}


/**
 * Prompts para análise climática agrícola com IA
 */

export const CLIMATE_ANALYSIS_SYSTEM_PROMPT = `Você é um agrometeorologista especializado em agricultura brasileira.

Sua função é analisar dados climáticos e fornecer insights práticos para produtores rurais, considerando:
- Impacto nas principais culturas (soja, milho, café, cana, algodão, pecuária)
- Calendário agrícola brasileiro (safra, safrinha, entressafra)
- Riscos e oportunidades climáticas
- Recomendações práticas de manejo

IMPORTANTE:
- Use linguagem clara e acessível para produtores
- Seja específico sobre regiões quando relevante
- Sempre mencione riscos potenciais
- Forneça recomendações acionáveis
- Considere o período atual do calendário agrícola`;

export const CLIMATE_ANALYSIS_PROMPT = `Analise os dados climáticos abaixo e forneça um relatório em formato markdown com:

## 1. Panorama Geral
Resumo da situação climática nas principais regiões produtoras.

## 2. Impacto por Cultura
Como as condições afetam:
- **Soja/Milho**: Plantio, desenvolvimento, colheita
- **Pecuária**: Pastagens, bem-estar animal
- **Café/Cana**: Condições específicas

## 3. Alertas Importantes
⚠️ Riscos climáticos que merecem atenção (seca, excesso de chuva, geada, etc.)

## 4. Recomendações
✅ Ações práticas para os próximos dias

## 5. Perspectiva
Tendência para os próximos 7 dias.

---

DADOS CLIMÁTICOS:

**Precipitação Prevista (próximos 7 dias):**
{precipitationData}

**Condições Atuais ({cityName}):**
- Temperatura: {temperature}°C
- Umidade: {humidity}%
- Vento: {windSpeed} km/h
- Condição: {condition}

**Previsão 7 dias ({cityName}):**
{forecastData}

**Data da Análise:** {date}
**Período Agrícola:** {agriculturalPeriod}`;

/**
 * Determina o período agrícola atual com base na data
 */
export function getAgriculturalPeriod(date: Date = new Date()): string {
    const month = date.getMonth() + 1; // 1-12

    // Calendário agrícola brasileiro simplificado
    if (month >= 9 && month <= 12) {
        return 'Plantio da Safra Principal (Soja/Milho 1ª safra)';
    } else if (month >= 1 && month <= 3) {
        return 'Desenvolvimento da Safra / Plantio Milho Safrinha';
    } else if (month >= 4 && month <= 6) {
        return 'Colheita da Soja / Desenvolvimento Milho Safrinha';
    } else {
        return 'Colheita Safrinha / Entressafra';
    }
}

/**
 * Formata dados de precipitação regional para o prompt
 */
export function formatPrecipitationForPrompt(
    regions: Array<{
        uf: string;
        name: string;
        region: string;
        accumulated7Days: number;
        daily: { time: string[]; precipitation: number[] };
    }>
): string {
    // Agrupa por região
    const grouped: Record<string, typeof regions> = {};
    for (const r of regions) {
        if (!grouped[r.region]) {
            grouped[r.region] = [];
        }
        grouped[r.region].push(r);
    }

    const lines: string[] = [];

    for (const [regionName, states] of Object.entries(grouped)) {
        lines.push(`\n**${regionName}:**`);
        for (const state of states) {
            const dailyStr = state.daily.precipitation
                .map((mm, i) => `${formatShortDate(state.daily.time[i])}: ${mm}mm`)
                .join(', ');
            lines.push(`- ${state.uf} (${state.name}): ${state.accumulated7Days}mm total [${dailyStr}]`);
        }
    }

    return lines.join('\n');
}

/**
 * Formata previsão diária para o prompt
 */
export function formatForecastForPrompt(
    daily: {
        time: string[];
        tempMax: number[];
        tempMin: number[];
        precipitationSum: number[];
        precipitationProb: number[];
    }
): string {
    return daily.time
        .map((date, i) => {
            const d = new Date(date + 'T12:00:00');
            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
            return `- ${dayName}: ${daily.tempMin[i]}°C - ${daily.tempMax[i]}°C, Chuva: ${daily.precipitationSum[i]}mm (${daily.precipitationProb[i]}% prob)`;
        })
        .join('\n');
}

function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Constrói o prompt completo para análise climática
 */
export function buildClimateAnalysisPrompt(params: {
    precipitationData: string;
    cityName: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    forecastData: string;
}): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return CLIMATE_ANALYSIS_PROMPT
        .replace('{precipitationData}', params.precipitationData)
        .replace('{cityName}', params.cityName)
        .replace('{temperature}', params.temperature.toString())
        .replace('{humidity}', params.humidity.toString())
        .replace('{windSpeed}', params.windSpeed.toString())
        .replace('{condition}', params.condition)
        .replace('{forecastData}', params.forecastData)
        .replace('{date}', dateStr)
        .replace('{agriculturalPeriod}', getAgriculturalPeriod(now));
}

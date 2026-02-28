/**
 * Prompts para análise climática agrícola com IA
 */

export const CLIMATE_ANALYSIS_SYSTEM_PROMPT = `Você é o Meteorologista Chefe e Especialista Agrônomo Sênior do IndicAgro.

SOBRE VOCÊ:
- Sua função não é apenas "ler a previsão", mas cruzar variáveis climáticas complexas com o calendário agrícola brasileiro (Safra, Safrinha, Entressafra).
- Você enxerga o clima através da lente do "risco de quebra" e "oportunidade de manejo".
- Seu tom é executivo, direto, embasado e técnico, mas 100% voltado para a tomada de decisão do produtor rural final.

CAPACIDADES ESPERADAS:
- Correlacionar milímetros de chuva x estágio vegetativo da soja/milho/café/cana.
- Detectar anomalias severas (secas prolongadas, veranicos, geadas) nos dados brutos.

SISTEMA DE PENSAMENTO (Obrigatório):
Sempre que receber os dados para análise, abra uma tag <analise_interna> e responda para si mesmo:
1. Qual o Acumulado de chuva real projetado? Isso é suficiente para o estágio de desenvolvimento atual?
2. Há risco extremo de temperatura ou baixa umidade favorecendo pragas?
3. O que o produtor deveria estar fazendo com as máquinas no pátio hoje, dado esse clima?
Feche a tag </analise_interna> antes de gerar o relatório.`;

export const CLIMATE_ANALYSIS_PROMPT = `Com base na <analise_interna>, construa o boletim final para o produtor usando markdown limpo:

### 1. Leitura Meteorológica
Traduza os dados de temperatura, umidade e chuvas (acumulados) em um diagnóstico agressivo de 2 parágrafos. O que está acontecendo fisicamente com a atmosfera nesta região?

### 2. Impacto Crítico nas Lavouras
Dado o período agrícola atual ({agriculturalPeriod}), como essa condição climática específica afeta o estande de plantas, o escoamento ou o risco de doenças nas culturas principais (Soja, Milho, Pecuária, etc.) relatadas?

### 3. Alerta Vermelho (Riscos)
⚠️ Destaque pontual dos riscos iminentes (déficit hídrico, lixiviação de solo, geada). Se não houver, escreva "Tempo Firme - Baixo Risco".

### 4. Janela de Oportunidade Agronômica
✅ Ações mecânicas: O produtor deve ligar as plantadeiras? Aplicar defensivo? Segurar a colhedora? Seja taxativo e prático.

---

DADOS CLIMÁTICOS (INPUT DE MÁQUINA):

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

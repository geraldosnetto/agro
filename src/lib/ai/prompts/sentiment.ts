/**
 * Prompts para análise de sentimento de notícias agrícolas
 * v2: Com categorias emocionais e drivers de mercado
 */

// Tipos de emoção do mercado
export const EMOTIONS = [
  'FEAR',        // Medo - preocupação com perdas
  'GREED',       // Ganância - otimismo agressivo
  'UNCERTAINTY', // Incerteza - falta de clareza
  'CONFIDENCE',  // Confiança - segurança nas previsões
  'PANIC',       // Pânico - reação extrema negativa
  'EUPHORIA',    // Euforia - otimismo extremo
] as const;

// Drivers que movimentam o mercado
export const MARKET_DRIVERS = [
  'CLIMA',      // Eventos climáticos
  'DEMANDA',    // Mudanças na demanda
  'OFERTA',     // Fatores de oferta
  'POLITICA',   // Políticas governamentais
  'CAMBIO',     // Variações cambiais
  'LOGISTICA',  // Questões de transporte/armazenamento
  'PRAGA',      // Pragas e doenças
  'TECNOLOGIA', // Inovações agrícolas
] as const;

// Timeframes de impacto
export const TIMEFRAMES = [
  'IMEDIATO',     // Próximas horas/dias
  'CURTO_PRAZO',  // Próximas semanas
  'MEDIO_PRAZO',  // Próximos meses
  'LONGO_PRAZO',  // Próxima safra/ano
] as const;

export type Emotion = typeof EMOTIONS[number];
export type MarketDriver = typeof MARKET_DRIVERS[number];
export type Timeframe = typeof TIMEFRAMES[number];

export const SENTIMENT_ANALYSIS_PROMPT = `Você é um analista especializado em mercado agrícola brasileiro com expertise em psicologia de mercado.

Analise a notícia abaixo e determine:

1. SENTIMENT: Sentimento geral (POSITIVE, NEGATIVE ou NEUTRAL)
2. SCORE: Valor de -1.0 (muito negativo) a 1.0 (muito positivo)
3. COMMODITIES: Commodities afetadas (slugs: soja, milho, boi-gordo, cafe-arabica, cafe-robusta, acucar-cristal, etanol-hidratado, etanol-anidro, algodao, trigo, arroz, frango, suino, leite, bezerro, mandioca)
4. IMPACT: Relevância do impacto (0 a 1)

5. EMOTION: Emoção predominante do mercado:
   - FEAR: Medo, preocupação com perdas (ex: "produtores temem quebra de safra")
   - GREED: Otimismo agressivo, busca por ganhos (ex: "exportações em alta recorde")
   - UNCERTAINTY: Incerteza, falta de clareza (ex: "mercado aguarda definição")
   - CONFIDENCE: Confiança, segurança (ex: "safra deve ser a maior da história")
   - PANIC: Pânico, reação extrema (ex: "preços despencam após embargo")
   - EUPHORIA: Euforia, otimismo extremo (ex: "produtores celebram preços recordes")

6. EMOTION_INTENSITY: Intensidade da emoção (0 a 1, onde 1 = muito intenso)

7. DRIVERS: Fatores que movimentam o mercado (array, pode ter múltiplos):
   - CLIMA: Eventos climáticos (seca, geada, chuva excessiva)
   - DEMANDA: Mudanças na demanda (exportação, consumo interno)
   - OFERTA: Fatores de oferta (safra, estoques, produção)
   - POLITICA: Políticas governamentais (tarifas, acordos, regulação)
   - CAMBIO: Variações do dólar
   - LOGISTICA: Transporte, armazenamento, portos
   - PRAGA: Pragas, doenças, problemas fitossanitários
   - TECNOLOGIA: Inovações, novos produtos, biotecnologia

8. TIMEFRAME: Quando o impacto será sentido:
   - IMEDIATO: Próximas horas/dias
   - CURTO_PRAZO: Próximas 1-4 semanas
   - MEDIO_PRAZO: Próximos 1-6 meses
   - LONGO_PRAZO: Próxima safra ou mais

9. REASONING: Explicação breve (2-3 frases) do porquê da classificação

CRITÉRIOS DE SENTIMENTO:
- POSITIVE: Aumento de preços, safra recorde, demanda forte, exportações em alta
- NEGATIVE: Queda de preços, quebra de safra, pragas, clima adverso, barreiras comerciais
- NEUTRAL: Notícias informativas, dados mistos, previsões incertas

Responda APENAS em formato JSON válido (sem markdown):
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "score": number,
  "commodities": string[],
  "impact": number,
  "emotion": "FEAR" | "GREED" | "UNCERTAINTY" | "CONFIDENCE" | "PANIC" | "EUPHORIA",
  "emotionIntensity": number,
  "drivers": string[],
  "timeframe": "IMEDIATO" | "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO",
  "reasoning": string
}

TÍTULO DA NOTÍCIA:
{title}

CONTEÚDO (se disponível):
{content}`;

export function buildSentimentPrompt(title: string, content?: string): string {
  return SENTIMENT_ANALYSIS_PROMPT
    .replace('{title}', title)
    .replace('{content}', content || 'Não disponível');
}

/**
 * Prompt para análise em lote (múltiplas notícias)
 */
export const BATCH_SENTIMENT_PROMPT = `Você é um analista especializado em mercado agrícola brasileiro.

Analise as notícias abaixo e classifique cada uma.

Para cada notícia, determine:
- sentiment: POSITIVE, NEGATIVE ou NEUTRAL
- score: -1.0 a 1.0
- commodities: array de slugs afetados
- impact: 0 a 1
- emotion: FEAR | GREED | UNCERTAINTY | CONFIDENCE | PANIC | EUPHORIA
- emotionIntensity: 0 a 1
- drivers: array de CLIMA | DEMANDA | OFERTA | POLITICA | CAMBIO | LOGISTICA | PRAGA | TECNOLOGIA
- timeframe: IMEDIATO | CURTO_PRAZO | MEDIO_PRAZO | LONGO_PRAZO

Responda APENAS em formato JSON válido (array):
[
  {
    "index": 0,
    "sentiment": "...",
    "score": 0.5,
    "commodities": ["soja"],
    "impact": 0.7,
    "emotion": "CONFIDENCE",
    "emotionIntensity": 0.6,
    "drivers": ["CLIMA", "OFERTA"],
    "timeframe": "CURTO_PRAZO"
  },
  ...
]

NOTÍCIAS:
{news}`;

export function buildBatchSentimentPrompt(news: Array<{ title: string; index: number }>): string {
  const newsText = news.map(n => `[${n.index}] ${n.title}`).join('\n');
  return BATCH_SENTIMENT_PROMPT.replace('{news}', newsText);
}

// Helper para obter cor da emoção
export function getEmotionColor(emotion: Emotion): string {
  const colors: Record<Emotion, string> = {
    FEAR: 'text-amber-500',
    GREED: 'text-emerald-500',
    UNCERTAINTY: 'text-slate-500',
    CONFIDENCE: 'text-blue-500',
    PANIC: 'text-red-500',
    EUPHORIA: 'text-purple-500',
  };
  return colors[emotion] || 'text-slate-500';
}

// Helper para obter emoji da emoção
export function getEmotionEmoji(emotion: Emotion): string {
  const emojis: Record<Emotion, string> = {
    FEAR: '😰',
    GREED: '🤑',
    UNCERTAINTY: '🤔',
    CONFIDENCE: '💪',
    PANIC: '😱',
    EUPHORIA: '🎉',
  };
  return emojis[emotion] || '😐';
}

// Helper para obter label da emoção
export function getEmotionLabel(emotion: Emotion): string {
  const labels: Record<Emotion, string> = {
    FEAR: 'Medo',
    GREED: 'Otimismo Agressivo',
    UNCERTAINTY: 'Incerteza',
    CONFIDENCE: 'Confiança',
    PANIC: 'Pânico',
    EUPHORIA: 'Euforia',
  };
  return labels[emotion] || emotion;
}

// Helper para obter cor do driver
export function getDriverColor(driver: MarketDriver): string {
  const colors: Record<MarketDriver, string> = {
    CLIMA: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
    DEMANDA: 'bg-green-500/10 text-green-600 border-green-500/30',
    OFERTA: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    POLITICA: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    CAMBIO: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    LOGISTICA: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    PRAGA: 'bg-red-500/10 text-red-600 border-red-500/30',
    TECNOLOGIA: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
  };
  return colors[driver] || 'bg-gray-500/10 text-gray-600 border-gray-500/30';
}

// Helper para obter label do driver
export function getDriverLabel(driver: MarketDriver): string {
  const labels: Record<MarketDriver, string> = {
    CLIMA: 'Clima',
    DEMANDA: 'Demanda',
    OFERTA: 'Oferta',
    POLITICA: 'Política',
    CAMBIO: 'Câmbio',
    LOGISTICA: 'Logística',
    PRAGA: 'Pragas',
    TECNOLOGIA: 'Tecnologia',
  };
  return labels[driver] || driver;
}

// Helper para obter label do timeframe
export function getTimeframeLabel(timeframe: Timeframe): string {
  const labels: Record<Timeframe, string> = {
    IMEDIATO: 'Imediato',
    CURTO_PRAZO: 'Curto Prazo',
    MEDIO_PRAZO: 'Médio Prazo',
    LONGO_PRAZO: 'Longo Prazo',
  };
  return labels[timeframe] || timeframe;
}

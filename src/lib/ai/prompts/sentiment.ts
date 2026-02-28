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

export const SENTIMENT_ANALYSIS_PROMPT = `Você é um Analista de Sentimento Sênior com foco em Algoritmos de Trading e Psicologia de Mercado Agrícola.

Analise a notícia fornecida. Sua tarefa exige profunda capacidade de abstração antes de classificar os dados.

TÍTULO DA NOTÍCIA: {title}
CONTEÚDO (se disponível): {content}

ESTRUTURA DE PROCESSAMENTO COGNITIVO (CHAIN-OF-THOUGHT):
Você DEVE processar a resposta EXCLUSIVAMENTE em formato JSON. 
A PRIMEIRA chave do seu JSON deve ser obrigatoriamente "_analise_interna", onde você escreverá um rascunho de até 3 frases cruzando a notícia com possíveis impactos de oferta/demanda antes de preencher as outras variáveis de forma fria.

Variáveis obrigatórias no JSON:
1. "_analise_interna": Seu rascunho de pensamento (CoT).
2. "sentiment": Sentimento geral (POSITIVE, NEGATIVE ou NEUTRAL)
3. "score": Valor de -1.0 (muito negativo) a 1.0 (muito positivo)
4. "commodities": Array de slugs afetados (ex: ["soja", "milho", "boi-gordo", "cafe-arabica"])
5. "impact": Relevância da notícia na precificação real, de 0.0 a 1.0.

6. "emotion": Emoção predominante do mercado:
   - FEAR: Medo de quebra ou perdas
   - GREED: Otimismo agressivo, super-lucro
   - UNCERTAINTY: Falta de rumo
   - CONFIDENCE: Garantia técnica de alta produtividade
   - PANIC: Colapso do book de ofertas
   - EUPHORIA: Quebra de máxima histórica

7. "emotionIntensity": Intensidade de 0.0 a 1.0
8. "drivers": Array contendo os gatilhos: ["CLIMA", "DEMANDA", "OFERTA", "POLITICA", "CAMBIO", "LOGISTICA", "PRAGA", "TECNOLOGIA"]
9. "timeframe": "IMEDIATO" | "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO"
10. "reasoning": Versão traduzida e curta da sua análise interna para o cliente final ler.

Responda APENAS em JSON válido, suportado por JSON.parse(). Nada fora do JSON. Exemplo de estrutura:
{
  "_analise_interna": "Para haver pânico, a seca deve... como a notícia cita 60 dias sem chuva, o loss de produtividade é irreversível para a soja do MS. Classificarei como NEGATIVE com emoção FEAR.",
  "sentiment": "NEGATIVE",
  "score": -0.85,
  ...
}`;

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

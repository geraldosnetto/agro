/**
 * Prompts para análise de sentimento de notícias agrícolas
 */

export const SENTIMENT_ANALYSIS_PROMPT = `Você é um analista especializado em mercado agrícola brasileiro.

Analise a notícia abaixo e determine:
1. SENTIMENT: O sentimento geral para o mercado agrícola (POSITIVE, NEGATIVE ou NEUTRAL)
2. SCORE: Um valor de -1.0 (muito negativo) a 1.0 (muito positivo)
3. COMMODITIES: Quais commodities são diretamente afetadas (use slugs: soja, milho, boi-gordo, cafe-arabica, acucar, etanol, algodao, trigo, arroz, frango, suino, leite, cacau, feijao, mandioca, laranja)
4. IMPACT: Relevância do impacto no mercado de 0 (irrelevante) a 1 (muito relevante)
5. REASONING: Explicação breve (1-2 frases) do porquê da classificação

CRITÉRIOS DE SENTIMENTO:
- POSITIVE: Notícias que indicam aumento de preços, safra recorde, demanda forte, exportações em alta, acordos comerciais favoráveis
- NEGATIVE: Notícias sobre queda de preços, quebra de safra, pragas, clima adverso, barreiras comerciais, custos em alta
- NEUTRAL: Notícias informativas sem impacto claro, dados mistos, ou previsões incertas

Responda APENAS em formato JSON válido, sem markdown:
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "score": number,
  "commodities": string[],
  "impact": number,
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

Responda APENAS em formato JSON válido (array):
[
  { "index": 0, "sentiment": "...", "score": 0.5, "commodities": ["soja"], "impact": 0.7 },
  ...
]

NOTÍCIAS:
{news}`;

export function buildBatchSentimentPrompt(news: Array<{ title: string; index: number }>): string {
  const newsText = news.map(n => `[${n.index}] ${n.title}`).join('\n');
  return BATCH_SENTIMENT_PROMPT.replace('{news}', newsText);
}

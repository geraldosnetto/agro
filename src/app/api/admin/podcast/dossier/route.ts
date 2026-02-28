import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getAnthropicClient, CLAUDE_MODELS } from "@/lib/ai/anthropic";

export async function GET(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Obter variação das 3 commodities principais (soja, milho, boi gordo) nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const commodities = await prisma.commodity.findMany({
            where: { slug: { in: ['soja', 'milho', 'boi-gordo'] } },
            include: {
                cotacoes: {
                    where: { dataReferencia: { gte: sevenDaysAgo } },
                    orderBy: { dataReferencia: 'desc' }
                }
            }
        });

        let dataContext = `DATA DE HOJE: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
        dataContext += `============================\n`;
        dataContext += `RESUMO DE PREÇOS (ÚLTIMOS 7 DIAS)\n`;
        dataContext += `============================\n`;

        for (const commodity of commodities) {
            if (commodity.cotacoes.length > 0) {
                const latest = commodity.cotacoes[0];
                const oldest = commodity.cotacoes[commodity.cotacoes.length - 1];
                const diff = Number(latest.valor) - Number(oldest.valor);
                const descMap = {
                    'soja': 'Saca 60kg',
                    'milho': 'Saca 60kg',
                    'boi-gordo': 'Arroba'
                };
                const desc = descMap[commodity.slug as keyof typeof descMap] || commodity.unidade;
                const status = diff > 0 ? "ALTA" : diff < 0 ? "QUEDA" : "ESTABILIDADE";

                dataContext += `\nCommodity: ${commodity.nome} (${desc})\n`;
                dataContext += `- Preço Atual: R$ ${latest.valor.toFixed(2)} (${latest.praca})\n`;
                dataContext += `- Variação na semana: ${status} de R$ ${Math.abs(diff).toFixed(2)}\n`;
            }
        }

        dataContext += `\n============================\n`;
        dataContext += `NOTÍCIAS E SENTIMENTO DO MERCADO\n`;
        dataContext += `============================\n`;

        const recentNews = await prisma.newsSentiment.findMany({
            orderBy: { analyzedAt: 'desc' },
            take: 5
        });

        if (recentNews.length > 0) {
            recentNews.forEach(news => {
                dataContext += `\n* Título: ${news.newsTitle}\n`;
                dataContext += `  Sentimento: ${news.sentiment} (Impacto: ${news.impactScore})\n`;
                const emocoes = [news.emotion, news.timeframe].filter(Boolean).join(" | ");
                if (emocoes) dataContext += `  Análise: ${emocoes}\n`;
            });
        } else {
            dataContext += `\nNenhuma notícia relevante registrada nesta semana.\n`;
        }

        // Passar os dados brutos para o Claude gerar um Dossiê narrativo perfeito para o NotebookLM absorver
        const anthropic = getAnthropicClient();
        const prompt = `Você é o Economista Chefe e Roteirista Líder do "AgroCast", o podcast oficial de inteligência de mercado do IndicAgro.
        
Sua missão é gerar um "Dossiê Resumo da Semana" cirúrgico. Este dossiê não será lido diretamente, ele servirá de base textual para alimentar a IA de voz (Google NotebookLM) que debaterá este texto em formato de mesacast.

DADOS DA SEMANA (INSUMOS BRUTOS):
${dataContext}

## INSTRUÇÕES DE RACIOCÍNIO (MANDATÓRIO)
Antes de escrever o roteiro final, use a tag <analise_interna> para decodificar os insumos:
1. Identifique qual das 3 commodities (Soja, Milho, Boi) teve o movimento mais brusco (bullish ou bearish).
2. Conecte esse movimento com pelo menos uma das notícias listadas (se houver sinergia óbvia).
3. Defina o 'humor' da semana (ex: pânico corporativo, otimismo de exportação, lateralização entediante).
Feche a tag </analise_interna> ao terminar a matemática.

## FORMATO DO DOSSIÊ (O QUE VOCÊ DEVE ENTREGAR APÓS A ANÁLISE)
Escreva o texto final em formato de narrativa ou "briefing" para os hosts do podcast lerem:

### 1. Abertura e Termômetro Geral
Comece resumindo o sentimento geral da semana em dois parágrafos amigáveis e impactantes.

### 2. O Pódio das Commodities
Crie um bloco para a Soja, um para o Milho e um para o Boi Gordo.
Fale os preços exatos e explique o PORQUÊ do movimento usando sua análise.

### 3. Fator Notícia
Destaque a notícia mais importante e explique como ela mexeu (ou pode mexer) com a vida e o bolso do produtor rural.

### REGRAS
- Somente texto e Markdown leve (sem tabelas pesadas).
- NUNCA use emojis.
- Tom de voz: Autoridade calma, estilo rádio jornalístico ("Boa noite, produtores...").
`;

        const msg = await anthropic.messages.create({
            model: CLAUDE_MODELS.HAIKU,
            max_tokens: 1500,
            temperature: 0.7,
            messages: [
                { role: "user", content: prompt }
            ]
        });

        const firstBlock = msg.content[0];
        const dossieContent = firstBlock.type === 'text' ? firstBlock.text : "Erro ao gerar dossiê.";

        return NextResponse.json({ dossie: dossieContent });
    } catch (error) {
        console.error("Dossiê Gen error:", error);
        return NextResponse.json({ error: "Failed to generate dossie" }, { status: 500 });
    }
}

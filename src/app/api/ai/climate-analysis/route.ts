import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import { fetchRegionalPrecipitation } from '@/lib/data-sources/precipitation';
import { fetchWeather, getWeatherDescription, type City } from '@/lib/data-sources/weather';
import {
    CLIMATE_ANALYSIS_SYSTEM_PROMPT,
    buildClimateAnalysisPrompt,
    formatPrecipitationForPrompt,
    formatForecastForPrompt
} from '@/lib/ai/prompts/climate-analysis';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema de validação
const QuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    cityName: z.string().min(1).default('Brasil'),
});

// Cache simples em memória (6 horas)
const analysisCache = new Map<string, { content: string; generatedAt: string; expiresAt: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Valores padrão: Sorriso-MT (capital da soja)
        const lat = searchParams.get('lat') || '-12.54';
        const lon = searchParams.get('lon') || '-55.72';
        const cityName = searchParams.get('cityName') || 'Sorriso, MT';

        const parsed = QuerySchema.safeParse({ lat, lon, cityName });

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Parâmetros inválidos', details: parsed.error.format() },
                { status: 400 }
            );
        }

        const { lat: latitude, lon: longitude, cityName: city } = parsed.data;

        // Verifica cache
        const cacheKey = `climate_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
        const cached = analysisCache.get(cacheKey);

        if (cached && Date.now() < cached.expiresAt) {
            return NextResponse.json({
                success: true,
                data: {
                    content: cached.content,
                    generatedAt: cached.generatedAt,
                    cached: true,
                },
            });
        }

        // Busca dados em paralelo
        const [precipitationData, weatherData] = await Promise.all([
            fetchRegionalPrecipitation(),
            fetchWeather(latitude, longitude),
        ]);

        if (!weatherData) {
            return NextResponse.json(
                { success: false, error: 'Não foi possível obter dados climáticos' },
                { status: 500 }
            );
        }

        // Formata dados para o prompt
        const precipitationText = formatPrecipitationForPrompt(precipitationData.regions);
        const forecastText = formatForecastForPrompt(weatherData.daily);
        const condition = getWeatherDescription(weatherData.current.conditionCode);

        const prompt = buildClimateAnalysisPrompt({
            precipitationData: precipitationText,
            cityName: city,
            temperature: weatherData.current.temperature,
            humidity: weatherData.current.humidity,
            windSpeed: weatherData.current.windSpeed,
            condition: condition.label,
            forecastData: forecastText,
        });

        // Chama Claude
        const client = getAnthropicClient();
        const config = MODEL_CONFIG.climateAnalysis;

        const response = await client.messages.create({
            model: config.model,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            system: CLIMATE_ANALYSIS_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        // Extrai o texto da resposta
        const textBlock = response.content.find((block) => block.type === 'text');
        const analysisContent = textBlock && 'text' in textBlock ? textBlock.text : '';

        if (!analysisContent) {
            return NextResponse.json(
                { success: false, error: 'Resposta vazia da IA' },
                { status: 500 }
            );
        }

        const generatedAt = new Date().toISOString();

        // Salva cache
        analysisCache.set(cacheKey, {
            content: analysisContent,
            generatedAt,
            expiresAt: Date.now() + CACHE_TTL,
        });

        // LOGGING DE CUSTO: Salvar como AIReport (transiente)
        // Isso permite que o calculador de custos pegue esse uso
        try {
            await prisma.aIReport.create({
                data: {
                    type: 'CLIMATE_ANALYSIS',
                    title: `Clima: ${city}`,
                    content: analysisContent, // Opcional: pode truncar se não quiser gastar storage
                    model: config.model,
                    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
                    generatedAt: new Date(generatedAt),
                    validUntil: new Date(Date.now() + CACHE_TTL),
                    reportDate: new Date(),
                    // Sem commodityId específico ou usar um genérico
                }
            });
        } catch (logError) {
            console.error('Falha ao logar custo de Climate Analysis:', logError);
            // Não quebra a request principal
        }

        return NextResponse.json({
            success: true,
            data: {
                content: analysisContent,
                generatedAt,
                cached: false,
                tokensUsed: response.usage?.output_tokens || 0,
                model: config.model,
            },
        });
    } catch (error) {
        console.error('Error in climate analysis:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao gerar análise climática' },
            { status: 500 }
        );
    }
}

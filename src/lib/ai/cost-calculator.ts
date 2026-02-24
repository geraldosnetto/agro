import prisma from "@/lib/prisma"
import { MODEL_COSTS, ClaudeModel } from "@/lib/ai/anthropic"

export type CostBreakdown = {
    totalCost: number
    byModel: Record<string, { tokens: number, cost: number }>
    period: string
}

export async function calculateAICosts(startDate: Date, endDate: Date): Promise<CostBreakdown> {
    const costs: CostBreakdown = {
        totalCost: 0,
        byModel: {},
        period: "Last 30 Days"
    }

    // 1. Calculate Chat Costs
    const chatUsage = await prisma.chatMessage.groupBy({
        by: ['model'],
        _sum: { tokensUsed: true },
        where: {
            createdAt: { gte: startDate, lte: endDate },
            role: 'assistant' // Only count assistant generation for now (though input counts too, usually model field is on assistant msg)
        }
    })

    // Note: ChatMessage model field might be null for older messages or user messages
    // The current implementation stores model on assistant message.
    // However, input tokens are also billed. The current schema stores 'tokensUsed' as total (input + output) on the assistant message.
    // This is an approximation if we don't have separate input/output counts.
    // We will use a blended price or the Output price (more expensive) to be safe, or an average.
    // Better: Use a 1:3 ratio assumption? 
    // Actually, src/app/api/ai/chat/route.ts stores tokensUsed = input + output.
    // Let's use a weighted average price for now: 25% input, 75% output is typical for chat? No, usually more input.
    // Let's use (Input Cost + Output Cost) / 2 as a rough estimator per token if we can't separate.

    // Actually, let's look at MODEL_COSTS in anthropic.ts
    // Haiku: 0.80 / 4.00. Avg ~ 2.40
    // Sonnet: 3.00 / 15.00. Avg ~ 9.00

    for (const item of chatUsage) {
        const model = item.model || 'claude-3-5-haiku-latest' // Default to Haiku
        const tokens = item._sum.tokensUsed || 0

        let costPerM = 0
        // Simple heuristic: 70% input, 30% output for chat context accumulation
        // Price = (0.7 * inputPrice + 0.3 * outputPrice)

        if (model.includes('haiku')) {
            costPerM = (0.7 * 0.80) + (0.3 * 4.00) // ~1.76
        } else if (model.includes('sonnet')) {
            costPerM = (0.7 * 3.00) + (0.3 * 15.00) // ~6.60
        } else if (model.includes('opus')) {
            costPerM = (0.7 * 15.00) + (0.3 * 75.00) // ~33.00
        } else {
            costPerM = 5.00 // Fallback
        }

        const cost = (tokens / 1_000_000) * costPerM

        if (!costs.byModel[model]) costs.byModel[model] = { tokens: 0, cost: 0 }
        costs.byModel[model].tokens += tokens
        costs.byModel[model].cost += cost
        costs.totalCost += cost
    }

    // 2. Calculate Report Costs
    const reportUsage = await prisma.aIReport.groupBy({
        by: ['model'],
        _sum: { tokensUsed: true },
        where: {
            generatedAt: { gte: startDate, lte: endDate }
        }
    })

    for (const item of reportUsage) {
        const model = item.model
        const tokens = item._sum.tokensUsed || 0

        let costPerM = 0
        // Reports usually have large context (input) and large output. 50/50?
        if (model.includes('haiku')) {
            costPerM = (0.5 * 0.80) + (0.5 * 4.00) // 2.40
        } else if (model.includes('sonnet')) {
            costPerM = (0.5 * 3.00) + (0.5 * 15.00) // 9.00
        } else {
            costPerM = 9.00
        }

        const cost = (tokens / 1_000_000) * costPerM

        if (!costs.byModel[model]) costs.byModel[model] = { tokens: 0, cost: 0 }
        costs.byModel[model].tokens += tokens
        costs.byModel[model].cost += cost
        costs.totalCost += cost
    }

    // 3. Calculate News Sentiment Costs (New)
    const sentimentUsage = await prisma.newsSentiment.groupBy({
        by: ['model'],
        _sum: { tokensUsed: true },
        where: {
            analyzedAt: { gte: startDate, lte: endDate }
        }
    })

    for (const item of sentimentUsage) {
        if (!item.model) continue // Skip legacy records without model

        const model = item.model
        const tokens = item._sum.tokensUsed || 0

        let costPerM = 0
        // Sentiment usually uses Haiku (cheap)
        if (model.includes('haiku')) {
            costPerM = (0.9 * 0.80) + (0.1 * 4.00) // Mostly input (news text) -> ~1.12
        } else {
            costPerM = 2.40 // Fallback
        }

        const cost = (tokens / 1_000_000) * costPerM

        if (!costs.byModel[model]) costs.byModel[model] = { tokens: 0, cost: 0 }
        costs.byModel[model].tokens += tokens
        costs.byModel[model].cost += cost
        costs.totalCost += cost
    }

    return costs
}

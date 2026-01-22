/**
 * Rate limiter simples baseado em memória
 * Para produção com múltiplas instâncias, considerar Redis
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number;  // Janela de tempo em ms
    maxRequests: number;  // Máximo de requests por janela
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minuto
    maxRequests: 60,       // 60 requests por minuto
};

/**
 * Limpa entradas expiradas periodicamente
 */
function cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}

// Limpa a cada 5 minutos
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupExpired, 5 * 60 * 1000);
}

/**
 * Extrai identificador do cliente (IP ou fallback)
 */
function getClientId(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    // Fallback para quando não há IP (desenvolvimento local)
    return 'anonymous';
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Verifica se a requisição deve ser limitada
 */
export function checkRateLimit(
    request: Request,
    config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
    const clientId = getClientId(request);
    const now = Date.now();

    let entry = rateLimitStore.get(clientId);

    // Se não existe ou expirou, cria nova entrada
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitStore.set(clientId, entry);

        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: entry.resetTime,
        };
    }

    // Incrementa contador
    entry.count += 1;

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
        allowed,
        remaining,
        resetTime: entry.resetTime,
    };
}

/**
 * Headers de rate limit para incluir na resposta
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    };
}

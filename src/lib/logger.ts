type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Em produção, só loga warn e error
const MIN_LEVEL = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
    debug(message: string, context?: LogContext): void {
        if (shouldLog('debug')) {
            console.log(formatMessage('debug', message, context));
        }
    },

    info(message: string, context?: LogContext): void {
        if (shouldLog('info')) {
            console.log(formatMessage('info', message, context));
        }
    },

    warn(message: string, context?: LogContext): void {
        if (shouldLog('warn')) {
            console.warn(formatMessage('warn', message, context));
        }
    },

    error(message: string, context?: LogContext): void {
        if (shouldLog('error')) {
            console.error(formatMessage('error', message, context));
        }
    },
};

export default logger;

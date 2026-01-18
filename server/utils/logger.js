/**
 * Structured Logger Utility
 * Provides consistent, structured logging with correlation IDs
 */

import { v4 as uuidv4 } from 'uuid';

// Log levels
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
};

const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

// Current log level from environment
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Create a structured log entry
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {Object} Structured log entry
 */
const createLogEntry = (level, message, context = {}) => {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: 'subscription-service',
        environment: process.env.NODE_ENV || 'development',
        ...context,
    };
};

/**
 * Output log entry
 * @param {Object} entry - Log entry
 */
const output = (entry) => {
    if (process.env.NODE_ENV === 'production') {
        // JSON format for production (easier to parse by log aggregators)
        console.log(JSON.stringify(entry));
    } else {
        // Human-readable format for development
        const { timestamp, level, message, correlationId, ...rest } = entry;
        const prefix = correlationId ? `[${correlationId.slice(0, 8)}]` : '';
        const extras = Object.keys(rest).length > 2
            ? `\n  ${JSON.stringify(rest, null, 2).replace(/\n/g, '\n  ')}`
            : '';
        console.log(`${timestamp} ${level.padEnd(5)} ${prefix} ${message}${extras}`);
    }
};

/**
 * Logger class with correlation ID support
 */
class Logger {
    constructor(correlationId = null, defaultContext = {}) {
        this.correlationId = correlationId || uuidv4();
        this.defaultContext = defaultContext;
    }

    /**
     * Create a child logger with additional context
     * @param {Object} context - Additional context
     * @returns {Logger} Child logger
     */
    child(context = {}) {
        return new Logger(this.correlationId, {
            ...this.defaultContext,
            ...context
        });
    }

    /**
     * Log at specified level
     * @param {number} levelNum - Log level number
     * @param {string} message - Log message
     * @param {Object} context - Additional context
     */
    log(levelNum, message, context = {}) {
        if (levelNum < currentLevel) return;

        const entry = createLogEntry(
            LEVEL_NAMES[levelNum],
            message,
            {
                correlationId: this.correlationId,
                ...this.defaultContext,
                ...context,
            }
        );
        output(entry);
    }

    debug(message, context = {}) {
        this.log(LOG_LEVELS.DEBUG, message, context);
    }

    info(message, context = {}) {
        this.log(LOG_LEVELS.INFO, message, context);
    }

    warn(message, context = {}) {
        this.log(LOG_LEVELS.WARN, message, context);
    }

    error(message, context = {}) {
        // If context is an Error, extract useful information
        if (context instanceof Error) {
            context = {
                error: {
                    name: context.name,
                    message: context.message,
                    stack: context.stack,
                },
            };
        }
        this.log(LOG_LEVELS.ERROR, message, context);
    }

    fatal(message, context = {}) {
        if (context instanceof Error) {
            context = {
                error: {
                    name: context.name,
                    message: context.message,
                    stack: context.stack,
                },
            };
        }
        this.log(LOG_LEVELS.FATAL, message, context);
    }

    /**
     * Log an audit event (always logged regardless of level)
     * @param {Object} auditData - Audit event data
     */
    audit(auditData) {
        const entry = createLogEntry('AUDIT', auditData.action, {
            correlationId: this.correlationId,
            audit: true,
            ...auditData,
        });
        output(entry);
    }

    /**
     * Log a metric (for monitoring)
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     * @param {Object} tags - Metric tags
     */
    metric(name, value, tags = {}) {
        const entry = createLogEntry('METRIC', name, {
            correlationId: this.correlationId,
            metric: true,
            metricName: name,
            metricValue: value,
            tags,
        });
        output(entry);
    }
}

/**
 * Create a new logger instance
 * @param {string} correlationId - Optional correlation ID
 * @param {Object} context - Default context
 * @returns {Logger} Logger instance
 */
export const createLogger = (correlationId = null, context = {}) => {
    return new Logger(correlationId, context);
};

/**
 * Express middleware to attach logger to request
 * @returns {Function} Express middleware
 */
export const loggerMiddleware = () => {
    return (req, res, next) => {
        // Use existing correlation ID from header or generate new one
        const correlationId = req.headers['x-correlation-id'] || uuidv4();

        // Create logger for this request
        req.logger = new Logger(correlationId, {
            method: req.method,
            path: req.path,
            userId: req.user?._id?.toString(),
        });

        // Set correlation ID in response header
        res.setHeader('X-Correlation-ID', correlationId);

        // Log request start
        req.logger.info('Request started', {
            query: req.query,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        // Log request end
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            req.logger.info('Request completed', {
                statusCode: res.statusCode,
                duration,
            });
            req.logger.metric('http_request_duration', duration, {
                method: req.method,
                path: req.path,
                status: res.statusCode,
            });
        });

        next();
    };
};

// Default logger for module-level logging
export const logger = createLogger();

export default { createLogger, loggerMiddleware, logger };

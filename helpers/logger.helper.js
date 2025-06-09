import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure the 'logs' directory exists
const logDir = path.join('logs');
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
} catch (err) {
    // Log directory creation failed, but continue without file logging
    console.warn(
        `Warning: Could not create log directory '${logDir}'. Continuing without file logging.`,
        err,
    );
}

/**
 * Safely serialize objects with circular references
 * @param {Object} obj - Object to serialize
 * @returns {string} - JSON string
 */
const safeStringify = (obj) => {
    const cache = new Set();
    return JSON.stringify(
        obj,
        (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                    return '[Circular Reference]';
                }
                cache.add(value);
            }
            return value;
        },
        2,
    );
};

// Define log format
const logFormat = winston.format.printf(
    ({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
            try {
                msg += safeStringify(metadata);
            } catch (error) {
                msg += ` [Error serializing metadata: ${error.message}]`;
            }
        }
        return msg;
    },
);

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Determine log level by environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'warn';
};

// Format to clean circular references in log data
const circularSafeFormat = winston.format((info) => {
    const cleanedInfo = { ...info };
    if (info.error instanceof Error) {
        cleanedInfo.error = {
            message: info.error.message,
            stack: info.error.stack,
            name: info.error.name,
        };
    }
    return cleanedInfo;
});

// Configure transports
const transports = [];

if (fs.existsSync(logDir)) {
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat,
            ),
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat,
            ),
        }),
    );
} else {
    console.warn(
        'Warning: Log directory not available. File logging disabled.',
    );
}

if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat,
            ),
        }),
    );
}

// Create logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format: winston.format.combine(
        circularSafeFormat(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
    ),
    defaultMeta: { service: 'petnow-api' },
    transports,
});

export default logger;

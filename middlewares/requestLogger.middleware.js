import logger from '../helpers/logger.helper.js';

/**
 * Creates a safe object from request data for logging without circular references
 * @param {Object} req - Express request object
 * @returns {Object} - Safe object for logging
 */
const getSafeRequestData = (req) => {
    return {
        method: req.method,
        url: req.originalUrl || req.url,
        ip:
            req.ip ||
            req.headers['x-forwarded-for'] ||
            req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        query: req.query,
        // Only include body if it's not multipart/form-data to avoid large binary data
        body: req.headers['content-type']?.includes('multipart/form-data')
            ? '(multipart form data)'
            : req.body,
    };
};

/**
 * HTTP request logger middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log basic request info at the start
    const requestData = getSafeRequestData(req);
    logger.info(
        `Request started: ${req.method} ${req.originalUrl || req.url}`,
        {
            request: requestData,
        },
    );

    // Log when the request completes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logMessage = {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip:
                req.ip ||
                req.headers['x-forwarded-for'] ||
                req.socket?.remoteAddress,
            userAgent: req.headers['user-agent'],
        };

        // Decide log level based on status code
        if (res.statusCode >= 500) {
            logger.error('Request completed', logMessage);
        } else if (res.statusCode >= 400) {
            logger.warn('Request completed', logMessage);
        } else {
            logger.info('Request completed', logMessage);
        }
    });

    next();
};

export default requestLogger;

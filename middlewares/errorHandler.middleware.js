import { errorResponse } from '../helpers/general.helper.js';
import logger from '../helpers/logger.helper.js';

/**
 * Creates a safe object from request data for error logging
 * @param {Object} req - Express request object
 * @returns {Object} - Safe object for logging
 */
const getSafeRequestData = (req) => {
    if (!req) return { missing: true };

    return {
        url: req.originalUrl || req.url,
        method: req.method,
        params: req.params,
        query: req.query,
        // Only include body if it's not multipart/form-data to avoid large binary data
        body:
            req.headers &&
            req.headers['content-type']?.includes('multipart/form-data')
                ? '(multipart form data)'
                : req.body,
        ip:
            req.ip ||
            req.headers?.['x-forwarded-for'] ||
            req.socket?.remoteAddress,
    };
};

/**
 * Get safe error object for logging
 * @param {Error} error - Error object
 * @returns {Object} - Safe error object
 */
const getSafeErrorData = (error) => {
    if (!error) return { missing: true };

    return {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
    };
};

const errorHandler = (error, req, res, next) => {
    try {
        if (next) {
            next();
        }
        const message =
            process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error';
        const statusCode = error.statusCode || 500;

        // Get safe request and error data
        const safeRequestData = getSafeRequestData(req);
        const safeErrorData = getSafeErrorData(error);

        // Log the error with detailed info
        logger.error(`${statusCode} - ${message}`, {
            error: safeErrorData,
            request: safeRequestData,
        });

        return errorResponse(res, { message }, statusCode, error);
    } catch (handlerError) {
        // If something goes wrong while handling the error itself
        logger.error('Failed in errorHandler:', {
            handlerError: getSafeErrorData(handlerError),
            originalError: getSafeErrorData(error),
        });

        // Safe fallback response
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while handling the error.',
        });
    }
};

export default errorHandler;

import jwt from 'jsonwebtoken';
import { TOKEN_EXPIRY_SHORT } from '../constants/common.constant.js';

export const successResponse = (res, data, statusCode = 200) => {
    return res.status(statusCode).json(data);
};

export const errorResponse = (res, data, statusCode = 500, error = null) => {
    if (error && error.isJoi) {
        data = { message: error.message };
        statusCode = 422;
    }
    return res.status(statusCode).json(data);
};

export const signAccessToken = async (userId, userType, expiresIn) => {
    const payload = { userType };
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
        expiresIn: expiresIn || TOKEN_EXPIRY_SHORT,
        issuer: '',
        audience: userId,
    };

    return new Promise((resolve, reject) => {
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) return reject(new Error('Failed to sign access token'));
            resolve(token);
        });
    });
};

export const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
};

export const getTodayDate = () => {
    const today = new Date();
    return today.setHours(0, 0, 0, 0);
};

export const getExpiryDate = (minutes) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

export const validateSortField = async (sortField, allowedSortFields) => {
    if (!allowedSortFields.includes(sortField) && sortField !== 'createdAt') {
        const error = new Error('Invalid sort field');
        error.isJoi = true;
        throw error;
    }
};

export const generatePassword = (length = 8) => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    return Array.from({ length }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');
};

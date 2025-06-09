import Joi from 'joi';
import { OBJECTID_PATTERN } from '../constants/common.constant.js';

export const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().required().messages({
        'string.base': 'Email must be string',
        'string.email': 'Email must be valid',
        'string.empty': 'Email can not be empty',
        'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'string.base': 'Email must be string',
        'string.empty': 'Password can not be empty',
        'any.required': 'Password is required',
    }),
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().required().messages({
        'string.base': 'Email must be a string.',
        'string.empty': 'Email cannot be empty.',
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is a required field.',
    }),
});

export const verifyForgotPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().required().messages({
        'string.base': 'Email must be a string.',
        'string.empty': 'Email cannot be empty.',
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is a required field.',
    }),
    otp: Joi.number().required().messages({
        'number.base': 'OTP must be a number.',
        'number.min': 'OTP must be a 6-digit number.',
        'number.max': 'OTP must be a 6-digit number.',
        'any.required': 'OTP is required field',
    }),
});

export const updatePasswordValidator = Joi.object({
    forgotPasswordRequestId: Joi.string()
        .regex(OBJECTID_PATTERN)
        .required()
        .messages({
            'string.base': 'Forgot password Request ID must be a string.',
            'string.pattern.base':
                'Forgot password Request ID must be a valid ObjectID format.',
            'string.empty': 'Forgot password Request ID cannot be empty.',
            'any.required': 'Forgot password Request ID is a required field.',
        }),
    newPassword: Joi.string().min(6).required().messages({
        'string.base': 'Password must be a string.',
        'any.required': 'Password is a required field.',
        'string.empty': 'Password cannot be empty.',
        'string.min': 'Password must be at least 6 characters long.',
    }),
});

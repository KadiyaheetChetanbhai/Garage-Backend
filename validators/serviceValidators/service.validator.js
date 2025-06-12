import Joi from 'joi';
import { DAYS_OF_WEEK_ARRAY } from '../../constants/common.constant.js';

const timeSlotSchema = Joi.object({
    day: Joi.string()
        .valid(...DAYS_OF_WEEK_ARRAY)
        .required()
        .messages({
            'any.required': 'Day is required',
            'any.only': 'Day must be one of: ' + DAYS_OF_WEEK_ARRAY.join(', '),
        }),
    open: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({
            'string.pattern.base':
                'Open time must be in HH:MM format (24-hour)',
            'any.required': 'Open time is required',
        }),
    close: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .required()
        .messages({
            'string.pattern.base':
                'Close time must be in HH:MM format (24-hour)',
            'any.required': 'Close time is required',
        }),
    isClosed: Joi.boolean().default(false),
});

export const createServiceSchema = Joi.object({
    name: Joi.string().required().trim().min(3).max(100).messages({
        'string.empty': 'Service name is required',
        'string.min': 'Service name must be at least 3 characters',
        'string.max': 'Service name cannot exceed 100 characters',
        'any.required': 'Service name is required',
    }),
    description: Joi.string().allow('').trim().max(1000).messages({
        'string.max': 'Description cannot exceed 1000 characters',
    }),
    price: Joi.number().required().positive().precision(2).messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be positive',
        'number.precision': 'Price cannot have more than 2 decimal places',
        'any.required': 'Price is required',
    }),
    duration: Joi.number().required().integer().min(5).max(480).messages({
        'number.base': 'Duration must be a number',
        'number.integer': 'Duration must be a whole number',
        'number.min': 'Duration must be at least 5 minutes',
        'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
        'any.required': 'Duration is required',
    }),
    category: Joi.string().required().messages({
        'string.empty': 'Category is required',
        'any.required': 'Category is required',
    }),
    image: Joi.string().allow('').trim().messages({
        'string.base': 'Image must be a valid URL or path',
    }),
    isActive: Joi.boolean().default(true),
    garage: Joi.string().required().messages({
        'string.empty': 'Garage is required',
        'any.required': 'Garage is required',
    }),
    availableTimeSlots: Joi.array().items(timeSlotSchema).default([]).messages({
        'array.base': 'Available time slots must be an array',
    }),
});

export const updateServiceSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).messages({
        'string.min': 'Service name must be at least 3 characters',
        'string.max': 'Service name cannot exceed 100 characters',
    }),
    description: Joi.string().allow('').trim().max(1000).messages({
        'string.max': 'Description cannot exceed 1000 characters',
    }),
    price: Joi.number().positive().precision(2).messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be positive',
        'number.precision': 'Price cannot have more than 2 decimal places',
    }),
    duration: Joi.number().integer().min(5).max(480).messages({
        'number.base': 'Duration must be a number',
        'number.integer': 'Duration must be a whole number',
        'number.min': 'Duration must be at least 5 minutes',
        'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
    }),
    category: Joi.string().messages({
        'string.empty': 'Category cannot be empty',
    }),
    image: Joi.string().allow('').trim().messages({
        'string.base': 'Image must be a valid URL or path',
    }),
    isActive: Joi.boolean(),
    availableTimeSlots: Joi.array().items(timeSlotSchema).messages({
        'array.base': 'Available time slots must be an array',
    }),
}).min(1); // At least one field must be present

import Joi from 'joi';
import { BOOKING_STATUS } from '../models/booking.model.js';
import { DAYS_OF_WEEK_ARRAY } from '../constants/common.constant.js';

// Schema for time slot validation
const timeSlotSchema = Joi.object({
    day: Joi.string()
        .valid(...DAYS_OF_WEEK_ARRAY)
        .required()
        .messages({
            'any.required': 'Day is required',
            'any.only': `Day must be one of: ${DAYS_OF_WEEK_ARRAY.join(', ')}`,
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

// Schema for pickup/drop validation
const pickupDropSchema = Joi.object({
    opted: Joi.boolean().required().messages({
        'any.required': 'Please specify if pickup/drop service is required',
    }),
    pickupAddress: Joi.string()
        .trim()
        .when('opted', {
            is: true,
            then: Joi.string().required().messages({
                'any.required':
                    'Pickup address is required when pickup/drop service is opted for',
            }),
            otherwise: Joi.string().allow('', null),
        }),
    dropAddress: Joi.string()
        .trim()
        .when('opted', {
            is: true,
            then: Joi.string().required().messages({
                'any.required':
                    'Drop address is required when pickup/drop service is opted for',
            }),
            otherwise: Joi.string().allow('', null),
        }),
});

// Create booking validation schema
export const createBookingSchema = Joi.object({
    customerId: Joi.string().required().messages({
        'string.empty': 'Customer ID is required',
        'any.required': 'Customer ID is required',
    }),
    garageId: Joi.string().required().messages({
        'string.empty': 'Garage ID is required',
        'any.required': 'Garage ID is required',
    }),
    serviceIds: Joi.array().items(Joi.string()).min(1).required().messages({
        'array.min': 'At least one service must be selected',
        'any.required': 'Service IDs are required',
    }),
    date: Joi.date().iso().min('now').required().messages({
        'date.base': 'Valid date is required',
        'date.min': 'Booking date cannot be in the past',
        'any.required': 'Booking date is required',
    }),
    timeSlots: Joi.array().items(timeSlotSchema).min(1).messages({
        'array.min': 'At least one time slot must be selected',
    }),
    pickupDrop: pickupDropSchema,
    transportPartnerId: Joi.string().allow('', null),
    totalAmount: Joi.number().positive().required().messages({
        'number.base': 'Total amount must be a number',
        'number.positive': 'Total amount must be positive',
        'any.required': 'Total amount is required',
    }),
    notes: Joi.string().allow('', null).max(500).messages({
        'string.max': 'Notes cannot exceed 500 characters',
    }),
});

// Update booking validation schema
export const updateBookingSchema = Joi.object({
    serviceIds: Joi.array().items(Joi.string()).min(1).messages({
        'array.min': 'At least one service must be selected',
    }),
    date: Joi.date().iso().min('now').messages({
        'date.base': 'Valid date is required',
        'date.min': 'Booking date cannot be in the past',
    }),
    timeSlots: Joi.array().items(timeSlotSchema).min(1).messages({
        'array.min': 'At least one time slot must be selected',
    }),
    pickupDrop: pickupDropSchema,
    transportPartnerId: Joi.string().allow('', null),
    status: Joi.string()
        .valid(...Object.values(BOOKING_STATUS))
        .messages({
            'any.only': `Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`,
        }),
    totalAmount: Joi.number().positive().messages({
        'number.base': 'Total amount must be a number',
        'number.positive': 'Total amount must be positive',
    }),
    paymentStatus: Joi.string()
        .valid('pending', 'completed', 'failed', 'refunded')
        .messages({
            'any.only':
                'Payment status must be one of: pending, completed, failed, refunded',
        }),
    invoiceUrl: Joi.string().allow('', null).uri().messages({
        'string.uri': 'Invoice URL must be a valid URL',
    }),
    notes: Joi.string().allow('', null).max(500).messages({
        'string.max': 'Notes cannot exceed 500 characters',
    }),
}).min(1); // At least one field must be present

// Filter bookings validation schema
export const filterBookingSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string()
        .valid('createdAt', 'date', 'status', 'totalAmount')
        .default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    status: Joi.string().valid(...Object.values(BOOKING_STATUS), 'all'),
    startDate: Joi.date().iso(),
    endDate: Joi.date()
        .iso()
        .when('startDate', {
            is: Joi.date().required(),
            then: Joi.date().greater(Joi.ref('startDate')).messages({
                'date.greater': 'End date must be after start date',
            }),
        }),
    customerId: Joi.string(),
    garageId: Joi.string(),
    searchTerm: Joi.string().trim(),
});

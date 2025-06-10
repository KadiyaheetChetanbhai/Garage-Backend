import Joi from 'joi';

export const createUserSchema = Joi.object({
    name: Joi.string().required().min(3).trim().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 3 characters long',
        'any.required': 'Name is required',
    }),
    email: Joi.string().email().lowercase().required().messages({
        'string.base': 'Email must be string',
        'string.email': 'Email must be valid',
        'string.empty': 'Email can not be empty',
        'any.required': 'Email is required',
    }),
});

export const updateUserSchema = Joi.object({
    name: Joi.string().min(3).trim().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 3 characters long',
    }),
    email: Joi.string().email().lowercase().messages({
        'string.base': 'Email must be string',
        'string.email': 'Email must be valid',
        'string.empty': 'Email can not be empty',
    }),
});

import Joi from 'joi';
import { OBJECTID_PATTERN } from '../../constants/common.constant.js';

export const createAdminSchema = Joi.object({
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
    permissions: Joi.array()
        .min(1)
        .unique()
        .required()
        .items(
            Joi.string().pattern(OBJECTID_PATTERN).messages({
                'string.pattern.base':
                    'Each permission must be a valid ObjectId',
                'string.base': 'Permission ID must be a string',
                'string.empty': 'Permission ID cannot be empty',
            }),
        )
        .messages({
            'array.base': 'Permissions must be an array',
            'array.min': 'At least one permission must be selected',
            'array.unique': 'Permissions must not contain duplicates',
            'any.required': 'Permissions field is required',
        }),
});

export const updateAdminSchema = Joi.object({
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
    permissions: Joi.array()
        .min(1)
        .unique()
        .items(
            Joi.string().pattern(OBJECTID_PATTERN).messages({
                'string.pattern.base':
                    'Each permission must be a valid ObjectId',
                'string.base': 'Permission ID must be a string',
                'string.empty': 'Permission ID cannot be empty',
            }),
        )
        .messages({
            'array.base': 'Permissions must be an array',
            'array.min': 'At least one permission must be selected',
            'array.unique': 'Permissions must not contain duplicates',
        }),
});

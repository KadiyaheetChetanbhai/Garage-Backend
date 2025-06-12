import Joi from 'joi';

export const createCategorySchema = Joi.object({
    name: Joi.string().required().trim().min(2).max(100).messages({
        'string.empty': 'Category name is required',
        'string.min': 'Category name must be at least 2 characters',
        'string.max': 'Category name cannot exceed 100 characters',
        'any.required': 'Category name is required',
    }),
    description: Joi.string().allow('').trim().max(500).messages({
        'string.max': 'Description cannot exceed 500 characters',
    }),
    icon: Joi.string().allow('').trim(),
    isActive: Joi.boolean().default(true),
    displayOrder: Joi.number().integer().default(0),
    featuredImage: Joi.string().allow('').trim(),
    metaTitle: Joi.string().allow('').trim().max(100).messages({
        'string.max': 'Meta title cannot exceed 100 characters',
    }),
    metaDescription: Joi.string().allow('').trim().max(200).messages({
        'string.max': 'Meta description cannot exceed 200 characters',
    }),
});

export const updateCategorySchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).messages({
        'string.min': 'Category name must be at least 2 characters',
        'string.max': 'Category name cannot exceed 100 characters',
    }),
    description: Joi.string().allow('').trim().max(500).messages({
        'string.max': 'Description cannot exceed 500 characters',
    }),
    icon: Joi.string().allow('').trim(),
    isActive: Joi.boolean(),
    displayOrder: Joi.number().integer(),
    featuredImage: Joi.string().allow('').trim(),
    metaTitle: Joi.string().allow('').trim().max(100).messages({
        'string.max': 'Meta title cannot exceed 100 characters',
    }),
    metaDescription: Joi.string().allow('').trim().max(200).messages({
        'string.max': 'Meta description cannot exceed 200 characters',
    }),
}).min(1); // At least one field must be present

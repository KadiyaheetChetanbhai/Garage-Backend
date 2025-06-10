import Joi from 'joi';

export const createBlogSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    author: Joi.string().required(),
    featuredImage: Joi.string().allow(''),
    category: Joi.string().valid('car', 'maintenance', 'repair', 'tips', 'industry', 'general'),
    tags: Joi.array().items(Joi.string()),
    status: Joi.string().valid('draft', 'published'),
    slug: Joi.string().allow(''),
    metaTitle: Joi.string().allow(''),
    metaDescription: Joi.string().allow('')
});

export const updateBlogSchema = Joi.object({
    title: Joi.string(),
    content: Joi.string(),
    featuredImage: Joi.string().allow(''),
    category: Joi.string().valid('car', 'maintenance', 'repair', 'tips', 'industry', 'general'),
    tags: Joi.array().items(Joi.string()),
    status: Joi.string().valid('draft', 'published'),
    slug: Joi.string().allow(''),
    metaTitle: Joi.string().allow(''),
    metaDescription: Joi.string().allow('')
});
import Joi from 'joi';

export const createServiceSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    price: Joi.number().min(0).required(),
    duration: Joi.number().min(1).required(),
    category: Joi.string()
        .valid('repair', 'maintenance', 'inspection', 'customization', 'other')
        .required(),
    image: Joi.string().allow(''),
    isActive: Joi.boolean(),
});

export const updateServiceSchema = Joi.object({
    name: Joi.string(),
    description: Joi.string().allow(''),
    price: Joi.number().min(0),
    duration: Joi.number().min(1),
    category: Joi.string().valid(
        'repair',
        'maintenance',
        'inspection',
        'customization',
        'other',
    ),
    image: Joi.string().allow(''),
    isActive: Joi.boolean(),
});

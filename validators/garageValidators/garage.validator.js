import Joi from 'joi';

export const createGarageSchema = Joi.object({
    ownerId: Joi.string().required(),
    name: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    pincode: Joi.string(),
    mapLink: Joi.string(),
    latitude: Joi.number(),
    longitude: Joi.number(),
    website: Joi.string().uri().allow(''),
    description: Joi.string(),
    priceRange: Joi.object({
        min: Joi.number(),
        max: Joi.number(),
    }),
    images: Joi.array().items(Joi.string()),
    servicesOffered: Joi.array().items(Joi.string()),
    pickupDropAvailable: Joi.boolean(),
    timeSlots: Joi.array().items(
        Joi.object({
            day: Joi.string().required(),
            open: Joi.string(),
            close: Joi.string(),
            isClosed: Joi.boolean(),
        }),
    ),
});

export const updateGarageSchema = Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    phone: Joi.string(),
    pincode: Joi.string(),
    mapLink: Joi.string(),
    latitude: Joi.number(),
    longitude: Joi.number(),
    website: Joi.string().uri().allow(''),
    description: Joi.string(),
    priceRange: Joi.object({
        min: Joi.number(),
        max: Joi.number(),
    }),
    images: Joi.array().items(Joi.string()),
    servicesOffered: Joi.array().items(Joi.string()),
    pickupDropAvailable: Joi.boolean(),
    timeSlots: Joi.array().items(
        Joi.object({
            day: Joi.string().required(),
            open: Joi.string(),
            close: Joi.string(),
            isClosed: Joi.boolean(),
        }),
    ),
});

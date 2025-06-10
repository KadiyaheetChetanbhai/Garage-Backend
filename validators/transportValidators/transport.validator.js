import Joi from 'joi';

export const createTransportSchema = Joi.object({
    garageId: Joi.string().required(),
    vehicleType: Joi.string()
        .valid('car', 'van', 'truck', 'motorcycle', 'other')
        .required(),
    vehicleName: Joi.string().required(),
    vehicleNumber: Joi.string().required(),
    capacity: Joi.number().min(1),
    driverName: Joi.string().allow(''),
    driverContact: Joi.string().allow(''),
    isActive: Joi.boolean(),
    note: Joi.string().allow(''),
});

export const updateTransportSchema = Joi.object({
    vehicleType: Joi.string().valid(
        'car',
        'van',
        'truck',
        'motorcycle',
        'other',
    ),
    vehicleName: Joi.string(),
    vehicleNumber: Joi.string(),
    capacity: Joi.number().min(1),
    driverName: Joi.string().allow(''),
    driverContact: Joi.string().allow(''),
    isActive: Joi.boolean(),
    note: Joi.string().allow(''),
});

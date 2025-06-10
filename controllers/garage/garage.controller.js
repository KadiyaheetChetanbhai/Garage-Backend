import mongoose from 'mongoose';
import {
    errorResponse,
    successResponse,
} from '../../helpers/general.helper.js';
import {
    paginationHelper,
    generateNavigations,
} from '../../helpers/pagination.helper.js';
import Garage from '../../models/garage.model.js';
import { validateSortField } from '../../helpers/general.helper.js';
import {
    createGarageSchema,
    updateGarageSchema,
} from '../../validators/garageValidators/garage.validator.js';

export const createGarage = async (req, res) => {
    try {
        const validatedData = await createGarageSchema.validateAsync(req.body);

        const newGarage = new Garage({
            ...validatedData,
            rating: 0, // Default rating for new garage
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newGarage.save();

        return successResponse(res, {
            message: 'Garage created successfully',
            data: newGarage,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to create garage', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

export const listGarages = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = ['name', 'createdAt', 'rating'];
        validateSortField(sortField, allowedSortFields);

        const matchConditions = [];

        if (searchTerm) {
            matchConditions.push({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { address: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        const data = await Garage.aggregate([
            { $match: matchConditions.length ? { $and: matchConditions } : {} },
            {
                $lookup: {
                    from: 'garageowners',
                    localField: 'ownerId',
                    foreignField: '_id',
                    as: 'owner',
                },
            },
            { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    address: 1,
                    phone: 1,
                    pincode: 1,
                    rating: 1,
                    images: { $slice: ['$images', 1] }, // Return only first image in list
                    pickupDropAvailable: 1,
                    priceRange: 1,
                    ownerName: '$owner.name',
                    createdAt: 1,
                },
            },
            { $sort: { [sortField]: sortOrder } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const [totalData] = await Garage.aggregate([
            { $match: matchConditions.length ? { $and: matchConditions } : {} },
            { $count: 'total' },
        ]);

        const totalCount = totalData ? totalData.total : 0;
        const { totalPages, nextPage, previousPage } = generateNavigations(
            page,
            limit,
            totalCount,
        );

        return successResponse(res, {
            message: 'Garages retrieved successfully',
            data,
            pagination: {
                page,
                nextPage,
                previousPage,
                totalPages,
                pageSize: limit,
                totalCount,
                sortOrder,
                sortBy: sortField,
                searchTerm,
            },
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to retrieve garages', error: error.message },
            500,
            error,
        );
    }
};

export const getGarageDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid garage ID format' },
                422,
            );
        }

        const garage = await Garage.findById(id)
            .populate('ownerId', 'name email')
            .populate('servicesOffered', 'name description price');

        if (!garage) {
            return errorResponse(res, { message: 'Garage not found' }, 404);
        }

        return successResponse(res, {
            message: 'Garage details retrieved successfully',
            data: garage,
        });
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to retrieve garage details',
                error: error.message,
            },
            500,
            error,
        );
    }
};

export const updateGarage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid garage ID format' },
                422,
            );
        }

        const garage = await Garage.findById(id);

        if (!garage) {
            return errorResponse(res, { message: 'Garage not found' }, 404);
        }

        const validatedData = await updateGarageSchema.validateAsync(req.body);
        validatedData.updatedAt = new Date();

        const updatedGarage = await Garage.findByIdAndUpdate(
            id,
            { $set: validatedData },
            { new: true, runValidators: true },
        );

        return successResponse(res, {
            message: 'Garage updated successfully',
            data: updatedGarage,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to update garage', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

export const deleteGarage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid garage ID format' },
                422,
            );
        }

        const garage = await Garage.findById(id);

        if (!garage) {
            return errorResponse(res, { message: 'Garage not found' }, 404);
        }

        await Garage.deleteOne({ _id: id });

        return successResponse(res, {
            message: 'Garage deleted successfully',
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to delete garage', error: error.message },
            500,
            error,
        );
    }
};

import mongoose from 'mongoose';
import {
    errorResponse,
    successResponse,
} from '../../helpers/general.helper.js';
import {
    paginationHelper,
    generateNavigations,
} from '../../helpers/pagination.helper.js';
import Transport from '../../models/transport.model.js';
import { validateSortField } from '../../helpers/general.helper.js';
import {
    createTransportSchema,
    updateTransportSchema,
} from '../../validators/transportValidators/transport.validator.js';

export const createTransport = async (req, res) => {
    try {
        const validatedData = await createTransportSchema.validateAsync(
            req.body,
        );

        // Check if garage exists
        const garageId = validatedData.garageId;
        if (!mongoose.Types.ObjectId.isValid(garageId)) {
            return errorResponse(
                res,
                { message: 'Invalid garage ID format' },
                422,
            );
        }

        // Create new transport vehicle
        const newTransport = new Transport(validatedData);
        await newTransport.save();

        return successResponse(res, {
            message: 'Transport vehicle created successfully',
            data: newTransport,
        });
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to create transport vehicle',
                error: error.message,
            },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

export const listTransports = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = ['vehicleName', 'vehicleType', 'createdAt'];
        validateSortField(sortField, allowedSortFields);

        const matchConditions = [];

        // Filter by garage if provided
        if (req.query.garageId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.garageId)) {
                return errorResponse(
                    res,
                    { message: 'Invalid garage ID format' },
                    422,
                );
            }
            matchConditions.push({
                garageId: new mongoose.Types.ObjectId(req.query.garageId),
            });
        }

        // Filter by vehicle type if provided
        if (req.query.vehicleType) {
            matchConditions.push({ vehicleType: req.query.vehicleType });
        }

        // Filter by active status if provided
        if (req.query.isActive !== undefined) {
            const isActive = req.query.isActive === 'true';
            matchConditions.push({ isActive: isActive });
        }

        if (searchTerm) {
            matchConditions.push({
                $or: [
                    { vehicleName: { $regex: searchTerm, $options: 'i' } },
                    { vehicleNumber: { $regex: searchTerm, $options: 'i' } },
                    { driverName: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        const data = await Transport.aggregate([
            { $match: matchConditions.length ? { $and: matchConditions } : {} },
            {
                $lookup: {
                    from: 'garages',
                    localField: 'garageId',
                    foreignField: '_id',
                    as: 'garage',
                },
            },
            { $unwind: { path: '$garage', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    vehicleType: 1,
                    vehicleName: 1,
                    vehicleNumber: 1,
                    capacity: 1,
                    driverName: 1,
                    isActive: 1,
                    garageName: '$garage.name',
                    createdAt: 1,
                },
            },
            { $sort: { [sortField]: sortOrder } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const [totalData] = await Transport.aggregate([
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
            message: 'Transport vehicles retrieved successfully',
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
            {
                message: 'Failed to retrieve transport vehicles',
                error: error.message,
            },
            500,
            error,
        );
    }
};

export const getTransportDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid transport ID format' },
                422,
            );
        }

        const transport = await Transport.findById(id).populate(
            'garageId',
            'name address',
        );

        if (!transport) {
            return errorResponse(
                res,
                { message: 'Transport vehicle not found' },
                404,
            );
        }

        return successResponse(res, {
            message: 'Transport vehicle details retrieved successfully',
            data: transport,
        });
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to retrieve transport vehicle details',
                error: error.message,
            },
            500,
            error,
        );
    }
};

export const updateTransport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid transport ID format' },
                422,
            );
        }

        const transport = await Transport.findById(id);

        if (!transport) {
            return errorResponse(
                res,
                { message: 'Transport vehicle not found' },
                404,
            );
        }

        const validatedData = await updateTransportSchema.validateAsync(
            req.body,
        );

        const updatedTransport = await Transport.findByIdAndUpdate(
            id,
            { $set: validatedData },
            { new: true, runValidators: true },
        );

        return successResponse(res, {
            message: 'Transport vehicle updated successfully',
            data: updatedTransport,
        });
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to update transport vehicle',
                error: error.message,
            },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

export const deleteTransport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid transport ID format' },
                422,
            );
        }

        const transport = await Transport.findById(id);

        if (!transport) {
            return errorResponse(
                res,
                { message: 'Transport vehicle not found' },
                404,
            );
        }

        await Transport.deleteOne({ _id: id });

        return successResponse(res, {
            message: 'Transport vehicle deleted successfully',
        });
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to delete transport vehicle',
                error: error.message,
            },
            500,
            error,
        );
    }
};

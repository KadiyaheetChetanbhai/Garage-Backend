import mongoose from 'mongoose';
import {
    errorResponse,
    successResponse,
} from '../../helpers/general.helper.js';
import {
    paginationHelper,
    generateNavigations,
} from '../../helpers/pagination.helper.js';
import Service from '../../models/service.model.js';
import { validateSortField } from '../../helpers/general.helper.js';
import {
    createServiceSchema,
    updateServiceSchema,
} from '../../validators/serviceValidators/service.validator.js';

export const createService = async (req, res) => {
    try {
        const validatedData = await createServiceSchema.validateAsync(req.body);

        const newService = new Service(validatedData);
        await newService.save();

        return successResponse(res, {
            message: 'Service created successfully',
            data: newService,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to create service', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

export const listServices = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = ['name', 'price', 'createdAt', 'category'];
        validateSortField(sortField, allowedSortFields);

        const matchConditions = [];

        // Add category filter if provided
        if (req.query.category) {
            matchConditions.push({ category: req.query.category });
        }

        // Add active filter if provided
        if (req.query.isActive !== undefined) {
            const isActive = req.query.isActive === 'true';
            matchConditions.push({ isActive: isActive });
        }

        if (searchTerm) {
            matchConditions.push({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        const data = await Service.aggregate([
            { $match: matchConditions.length ? { $and: matchConditions } : {} },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    price: 1,
                    duration: 1,
                    category: 1,
                    image: 1,
                    isActive: 1,
                    createdAt: 1,
                },
            },
            { $sort: { [sortField]: sortOrder } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const [totalData] = await Service.aggregate([
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
            message: 'Services retrieved successfully',
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
            { message: 'Failed to retrieve services', error: error.message },
            500,
            error,
        );
    }
};

export const getServiceDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid service ID format' },
                422,
            );
        }

        const service = await Service.findById(id);

        if (!service) {
            return errorResponse(res, { message: 'Service not found' }, 404);
        }

        return successResponse(res, {
            message: 'Service details retrieved successfully',
            data: service,
        });
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to retrieve service details',
                error: error.message,
            },
            500,
            error,
        );
    }
};

export const updateService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid service ID format' },
                422,
            );
        }

        const service = await Service.findById(id);

        if (!service) {
            return errorResponse(res, { message: 'Service not found' }, 404);
        }

        const validatedData = await updateServiceSchema.validateAsync(req.body);

        const updatedService = await Service.findByIdAndUpdate(
            id,
            { $set: validatedData },
            { new: true, runValidators: true },
        );

        return successResponse(res, {
            message: 'Service updated successfully',
            data: updatedService,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to update service', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid service ID format' },
                422,
            );
        }

        const service = await Service.findById(id);

        if (!service) {
            return errorResponse(res, { message: 'Service not found' }, 404);
        }

        await Service.deleteOne({ _id: id });

        return successResponse(res, {
            message: 'Service deleted successfully',
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to delete service', error: error.message },
            500,
            error,
        );
    }
};

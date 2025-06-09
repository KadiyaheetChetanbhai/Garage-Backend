import mongoose from 'mongoose';
import Service from '../../models/petService.model.js';
import {
    errorResponse,
    successResponse,
    validateSortField,
} from '../../helpers/general.helper.js';
import {
    generateNavigations,
    paginationHelper,
} from '../../helpers/pagination.helper.js';

/**
 * Get all parent services with their child services
 * This API returns paginated list of parent services, each with its child services
 */
export const getAllServices = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = ['createdAt', 'serviceName', 'updatedAt'];
        validateSortField(sortField, allowedSortFields);

        // Match only parent services
        const matchConditions = [{ parentId: null, isParentService: true }];

        // Add search condition if searchTerm is provided
        if (searchTerm) {
            matchConditions.push({
                $or: [
                    { serviceName: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        // Aggregate to get parent services with their child services
        const services = await Service.aggregate([
            {
                $match: matchConditions.length ? { $and: matchConditions } : {},
            },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id',
                    foreignField: 'parentId',
                    as: 'childServices',
                },
            },
            {
                $project: {
                    _id: 1,
                    serviceName: 1,
                    description: 1,
                    childServices: {
                        $map: {
                            input: '$childServices',
                            as: 'child',
                            in: {
                                _id: '$$child._id',
                                serviceName: '$$child.serviceName',
                                description: '$$child.description',
                            },
                        },
                    },
                },
            },
            { $sort: { [sortField]: sortOrder } },
            { $skip: skip },
            { $limit: limit },
        ]);

        // Count total parent services for pagination
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

        return successResponse(
            res,
            {
                message: 'Services retrieved successfully',
                data: services,
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
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error retrieving services', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Get a single parent service with its child services
 * This API returns a specific parent service with all its child services
 */
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the service exists and is a parent
        const service = await Service.findOne({
            _id: id,
            isParentService: true,
        });

        if (!service) {
            return errorResponse(res, { message: 'Service not found' }, 404);
        }

        // Get parent service with its child services
        const serviceWithChildren = await Service.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) },
            },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id',
                    foreignField: 'parentId',
                    as: 'childServices',
                },
            },
            {
                $project: {
                    _id: 1,
                    serviceName: 1,
                    description: 1,
                    childServices: {
                        $map: {
                            input: '$childServices',
                            as: 'child',
                            in: {
                                _id: '$$child._id',
                                serviceName: '$$child.serviceName',
                                description: '$$child.description',
                            },
                        },
                    },
                },
            },
        ]);

        return successResponse(
            res,
            {
                message: 'Service retrieved successfully',
                data: serviceWithChildren[0],
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error retrieving service', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Get child service details
 * This API returns details for a specific child service, including its parent service
 */
export const getChildServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if service exists and is a child service
        const childService = await Service.findOne({
            _id: id,
            isParentService: false,
        });

        if (!childService) {
            return errorResponse(
                res,
                { message: 'Child service not found' },
                404,
            );
        }

        // Get child service with its parent info
        const childWithParent = await Service.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) },
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'parentId',
                    foreignField: '_id',
                    as: 'parentService',
                },
            },
            {
                $project: {
                    _id: 1,
                    serviceName: 1,
                    description: 1,
                    parentService: {
                        $map: {
                            input: '$parentService',
                            as: 'parent',
                            in: {
                                _id: '$$parent._id',
                                serviceName: '$$parent.serviceName',
                            },
                        },
                    },
                },
            },
        ]);

        return successResponse(
            res,
            {
                message: 'Child service retrieved successfully',
                data: childWithParent[0],
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error retrieving child service', error: error.message },
            500,
            error,
        );
    }
};

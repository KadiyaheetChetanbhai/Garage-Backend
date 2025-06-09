import HomemadeDiet from '../../models/homemadeDiet.model.js';
import {
    errorResponse,
    successResponse,
    validateSortField,
} from '../../helpers/general.helper.js';
import {
    generateNavigations,
    paginationHelper,
} from '../../helpers/pagination.helper.js';
import mongoose from 'mongoose';

/**
 * Get all homemade diets
 * This API returns a paginated list of homemade diets
 */
export const getAllHomemadeDiets = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = ['createdAt', 'name', 'updatedAt'];
        validateSortField(sortField, allowedSortFields);

        // Build match conditions
        const matchConditions = [];

        // Add search condition if searchTerm is provided
        if (searchTerm) {
            matchConditions.push({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { information: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        // Aggregate to get homemade diets
        const homemadeDiets = await HomemadeDiet.aggregate([
            {
                $match: matchConditions.length ? { $and: matchConditions } : {},
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: {
                        $cond: {
                            if: {
                                $regexMatch: {
                                    input: '$image',
                                    regex: '^http',
                                },
                            },
                            then: '$image',
                            else: {
                                $concat: [process.env.SERVER_URL, '$image'],
                            },
                        },
                    },
                    sources: 1,
                    information: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    description: 1,
                },
            },
            { $sort: { [sortField]: sortOrder } },
            { $skip: skip },
            { $limit: limit },
        ]);

        // Count total homemade diets for pagination
        const [totalData] = await HomemadeDiet.aggregate([
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
                message: 'Homemade diets retrieved successfully',
                data: homemadeDiets,
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
            {
                message: 'Error retrieving homemade diets',
                error: error.message,
            },
            500,
            error,
        );
    }
};

/**
 * Get a single homemade diet by ID
 * This API returns details of a specific homemade diet
 */
export const getHomemadeDietById = async (req, res) => {
    try {
        const { id } = req.params;

        // Use aggregation pipeline to get homemade diet with full URL
        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: {
                        $cond: {
                            if: {
                                $regexMatch: {
                                    input: '$image',
                                    regex: '^http',
                                },
                            },
                            then: '$image',
                            else: {
                                $concat: [process.env.SERVER_URL, '$image'],
                            },
                        },
                    },
                    sources: 1,
                    information: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    description: 1,
                },
            },
        ];

        const homemadeDiets = await HomemadeDiet.aggregate(pipeline);

        if (!homemadeDiets.length) {
            return errorResponse(
                res,
                { message: 'Homemade diet not found' },
                404,
            );
        }

        return successResponse(
            res,
            {
                message: 'Homemade diet retrieved successfully',
                data: homemadeDiets[0],
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error retrieving homemade diet', error: error.message },
            500,
            error,
        );
    }
};

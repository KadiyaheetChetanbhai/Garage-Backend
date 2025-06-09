import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { errorResponse, successResponse } from '../helpers/general.helper.js';
import logger from '../helpers/logger.helper.js';

export const getProfile = async (req, res) => {
    try {
        const [data] = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(req.userId) },
            },
            {
                $lookup: {
                    from: 'permissions',
                    let: { permissionIds: '$permissions' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$_id', '$$permissionIds'] },
                            },
                        },
                        {
                            $group: {
                                _id: '$module',
                                name: { $first: '$name' },
                                module: { $first: '$module' },
                                events: {
                                    $push: '$event',
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                module: 1,
                                name: 1,
                                events: 1,
                            },
                        },
                    ],
                    as: 'permissions',
                },
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    permissions: 1,
                    userType: 1,
                },
            },
        ]);
        if (!data) {
            return errorResponse(res, { message: 'User not found' }, 404);
        }
        return successResponse(res, {
            message: 'User profile retrieved successfully',
            data,
        });
    } catch (error) {
        logger.error('error in getProfile', error);

        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

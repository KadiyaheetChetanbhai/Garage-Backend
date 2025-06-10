import mongoose from 'mongoose';
import { USER_TYPES } from '../../constants/common.constant.js';
import {
    errorResponse,
    generatePassword,
    successResponse,
    validateSortField,
} from '../../helpers/general.helper.js';
import {
    generateNavigations,
    paginationHelper,
} from '../../helpers/pagination.helper.js';
import { sendMail } from '../../mail/sendMail.js';
import User from '../../models/user.model.js';
import {
    createUserSchema,
    updateUserSchema,
} from '../../validators/userValidators/userManagement.validator.js';

export const createUser = async (req, res) => {
    try {
        const { name, email } = await createUserSchema.validateAsync(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(
                res,
                { message: 'User already exists with this email' },
                422,
            );
        }

        // Generate password for new user
        const password = generatePassword();

        // Create user with consistent userType
        const newUser = await new User({
            name,
            email,
            password,
            userType: USER_TYPES.USER,
        }).save();

        // Send welcome email with login credentials
        sendMail({
            to: newUser.email,
            subject: 'Account created',
            type: 'accountCreated',
            data: {
                name: newUser.name,
                email: newUser.email,
                password: password,
            },
        });

        return successResponse(res, {
            message: 'User created successfully',
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const listUsers = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = ['createdAt', 'name', 'email'];
        validateSortField(sortField, allowedSortFields);

        // Use same USER constant as in createUser
        const matchConditions = [{ userType: USER_TYPES.USER }];

        if (searchTerm) {
            matchConditions.push({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        const data = await User.aggregate([
            {
                $match: matchConditions.length ? { $and: matchConditions } : {},
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    createdAt: 1,
                    isEditable: 1,
                },
            },
            { $sort: { [sortField]: sortOrder } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const [totalData] = await User.aggregate([
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
            message: 'User list retrieved successfully',
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
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const getUserDetail = async (req, res) => {
    try {
        const { id: UserId } = req.params;

        const [data] = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(UserId) },
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    userType: 1,
                    createdAt: 1,
                },
            },
        ]);
        if (!data) {
            return errorResponse(res, { message: 'User not found' }, 404);
        }
        return successResponse(res, {
            message: 'User details retrieved successfully',
            data,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id: UserId } = req.params;
        const { name, email } = await updateUserSchema.validateAsync(req.body);

        const existingUser = await User.findById(UserId);
        if (!existingUser) {
            return errorResponse(res, { message: 'User not found' }, 404);
        }
        if (!existingUser.isEditable) {
            return errorResponse(
                res,
                { message: 'This User is not allowed to be edited' },
                422,
            );
        }

        if (email && email !== existingUser.email) {
            const emailTaken = await User.findOne({ email });
            if (emailTaken) {
                return errorResponse(
                    res,
                    { message: 'Email already in use by another account' },
                    422,
                );
            }
        }

        if (name) existingUser.name = name;
        if (email) existingUser.email = email;

        await existingUser.save();
        return successResponse(res, { message: 'User updated successfully' });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id: UserId } = req.params;

        const existingUser = await User.findById(UserId);
        if (!existingUser) {
            return errorResponse(res, { message: 'User not found' }, 404);
        }
        if (!existingUser.isEditable) {
            return errorResponse(
                res,
                { message: 'This User is not allowed to be deleted' },
                422,
            );
        }
        await User.findByIdAndDelete(UserId);
        return successResponse(res, { message: 'User deleted successfully' });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

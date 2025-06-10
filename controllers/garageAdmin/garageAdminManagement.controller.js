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
import garageAdmin from '../../models/garageOwner.model.js';
import {
    createGarageAdminSchema,
    updateGarageAdminSchema,
} from '../../validators/garageAdminValidators/garageAdminmanagement.validator.js';

export const createGarageAdmin = async (req, res) => {
    try {
        const { name, email } = await createGarageAdminSchema.validateAsync(
            req.body,
        );

        const existingGarageAdmin = await garageAdmin.findOne({ email });
        if (existingGarageAdmin) {
            return errorResponse(
                res,
                { message: 'GarageAdmin already exists with this email' },
                422,
            );
        }
        const password = generatePassword();
        const newGarageAdmin = await new garageAdmin({
            name,
            email,
            password,
            userType: USER_TYPES.GARAGE_ADMIN,
        }).save();

        sendMail({
            to: newGarageAdmin.email,
            subject: 'Account created',
            type: 'accountCreated',
            data: {
                name: newGarageAdmin.name,
                email: newGarageAdmin.email,
                password: password,
            },
        });

        return successResponse(res, {
            message: 'GarageAdmin created successfully',
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

export const listGarageAdmin = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = ['createdAt', 'name', 'email'];
        validateSortField(sortField, allowedSortFields);

        const matchConditions = [{ userType: USER_TYPES.GARAGE_OWNER }];

        if (searchTerm) {
            matchConditions.push({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        const data = await garageAdmin.aggregate([
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

        const [totalData] = await garageAdmin.aggregate([
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
            message: 'GarageAdmin list retrieved successfully',
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

export const getGarageAdminDetail = async (req, res) => {
    try {
        const { id: GarageAdminId } = req.params;

        const [data] = await garageAdmin.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(GarageAdminId) },
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

export const updateGarageAdmin = async (req, res) => {
    try {
        const { id: GarageAdminId } = req.params;
        const { name, email } = await updateGarageAdminSchema.validateAsync(
            req.body,
        );

        const existingGarageAdmin = await garageAdmin.findById(GarageAdminId);
        if (!existingGarageAdmin) {
            return errorResponse(
                res,
                { message: 'GarageAdmin not found' },
                404,
            );
        }
        if (!existingGarageAdmin.isEditable) {
            return errorResponse(
                res,
                { message: 'This GarageAdmin is not allowed to be edited' },
                422,
            );
        }

        if (email && email !== existingGarageAdmin.email) {
            const emailTaken = await garageAdmin.findOne({ email });
            if (emailTaken) {
                return errorResponse(
                    res,
                    { message: 'Email already in use by another account' },
                    422,
                );
            }
        }

        if (name) existingGarageAdmin.name = name;
        if (email) existingGarageAdmin.email = email;

        await existingGarageAdmin.save();
        return successResponse(res, {
            message: 'GarageAdmin updated successfully',
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

export const deleteGarageAdmin = async (req, res) => {
    try {
        const { id: GarageAdminId } = req.params;

        const existingGarageAdmin = await garageAdmin.findById(GarageAdminId);
        if (!existingGarageAdmin) {
            return errorResponse(
                res,
                { message: 'GarageAdmin not found' },
                404,
            );
        }
        if (!existingGarageAdmin.isEditable) {
            return errorResponse(
                res,
                { message: 'This GarageAdmin is not allowed to be deleted' },
                422,
            );
        }
        await garageAdmin.findByIdAndDelete(GarageAdminId);
        return successResponse(res, {
            message: 'garageAdmin deleted successfully',
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

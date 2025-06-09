import mongoose from 'mongoose';
import { USER_TYPES } from '../../constants/common.constant.js';
import { sendMail } from '../../mail/sendMail.js';
import Permission from '../../models/permission.model.js';
import User from '../../models/user.model.js';
import {
    errorResponse,
    generatePassword,
    successResponse,
    validateSortField,
} from '../../helpers/general.helper.js';
import {
    createAdminSchema,
    updateAdminSchema,
} from '../../validators/adminValidators/adminManagement.validator.js';
import {
    generateNavigations,
    paginationHelper,
} from '../../helpers/pagination.helper.js';

export const getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.aggregate([
            {
                $group: {
                    _id: '$module',
                    name: { $first: '$name' },
                    module: { $first: '$module' },
                    events: {
                        $push: {
                            permissionId: '$_id',
                            event: '$event',
                        },
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
        ]);
        return successResponse(res, {
            message: 'Permissions retrieved successfully',
            data: permissions,
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

export const createAdmin = async (req, res) => {
    try {
        const { name, email, permissions } =
            await createAdminSchema.validateAsync(req.body);

        const existingPermissions = await Permission.find({
            _id: { $in: permissions },
        });
        if (existingPermissions.length !== permissions.length) {
            return errorResponse(
                res,
                { message: 'One or more permission not found' },
                422,
            );
        }

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return errorResponse(
                res,
                { message: 'Admin already exists with this email' },
                422,
            );
        }
        const password = generatePassword();
        const newAdmin = await new User({
            name,
            email,
            password,
            userType: USER_TYPES.ADMIN,
            permissions,
        }).save();

        sendMail({
            to: newAdmin.email,
            subject: 'Account created',
            type: 'accountCreated',
            data: {
                name: newAdmin.name,
                email: newAdmin.email,
                password: password,
            },
        });

        return successResponse(res, { message: 'Admin created successfully' });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const listAdmins = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = ['createdAt', 'name', 'email'];
        validateSortField(sortField, allowedSortFields);

        const matchConditions = [{ userType: USER_TYPES.ADMIN }];

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
            message: 'Admin list retrieved successfully',
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

export const getAdminDetail = async (req, res) => {
    try {
        const { id: adminId } = req.params;

        const [data] = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(adminId) },
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
                    userType: 1,
                    createdAt: 1,
                    permissions: 1,
                },
            },
        ]);
        if (!data) {
            return errorResponse(res, { message: 'Admin not found' }, 404);
        }
        return successResponse(res, {
            message: 'Admin details retrieved successfully',
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

export const updateAdmin = async (req, res) => {
    try {
        const { id: adminId } = req.params;
        const { name, email, permissions } =
            await updateAdminSchema.validateAsync(req.body);

        const existingAdmin = await User.findById(adminId);
        if (!existingAdmin) {
            return errorResponse(res, { message: 'Admin not found' }, 404);
        }
        if (!existingAdmin.isEditable) {
            return errorResponse(
                res,
                { message: 'This admin is not allowed to be edited' },
                422,
            );
        }

        if (email && email !== existingAdmin.email) {
            const emailTaken = await User.findOne({ email });
            if (emailTaken) {
                return errorResponse(
                    res,
                    { message: 'Email already in use by another account' },
                    422,
                );
            }
        }

        if (permissions && permissions.length > 0) {
            const existingPermissions = await Permission.find({
                _id: { $in: permissions },
            });
            if (existingPermissions.length !== permissions.length) {
                return errorResponse(
                    res,
                    { message: 'One or more permissions not found' },
                    422,
                );
            }
        }

        if (name) existingAdmin.name = name;
        if (email) existingAdmin.email = email;
        if (permissions) existingAdmin.permissions = permissions;

        await existingAdmin.save();
        return successResponse(res, { message: 'Admin updated successfully' });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const deleteAdmin = async (req, res) => {
    try {
        const { id: adminId } = req.params;

        const existingAdmin = await User.findById(adminId);
        if (!existingAdmin) {
            return errorResponse(res, { message: 'Admin not found' }, 404);
        }
        if (!existingAdmin.isEditable) {
            return errorResponse(
                res,
                { message: 'This admin is not allowed to be deleted' },
                422,
            );
        }
        await User.findByIdAndDelete(adminId);
        return successResponse(res, { message: 'Admin deleted successfully' });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

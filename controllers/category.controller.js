import Category from '../models/category.model.js';
import Service from '../models/service.model.js';
import { errorResponse, successResponse } from '../helpers/general.helper.js';
import {
    createCategorySchema,
    updateCategorySchema,
} from '../validators/category.validator.js';
import mongoose from 'mongoose';
import logger from '../helpers/logger.helper.js';

/**
 * Create a new category
 */
export const createCategory = async (req, res) => {
    try {
        // Validate request body
        const validatedData = await createCategorySchema.validateAsync(
            req.body,
        );

        // Check if category with same name already exists (case insensitive)
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${validatedData.name.trim()}$`, 'i') },
        });

        if (existingCategory) {
            return errorResponse(
                res,
                {
                    message: 'A category with this name already exists',
                },
                409,
            );
        }

        // Create new category
        const newCategory = new Category(validatedData);
        await newCategory.save();

        return successResponse(
            res,
            {
                message: 'Category created successfully',
                data: newCategory,
            },
            201,
        );
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to create category',
                error: error.message,
            },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

/**
 * Get all categories with optional filtering
 */
export const getCategories = async (req, res) => {
    try {
        const {
            isActive,
            search,
            sort = 'displayOrder',
            order = 'asc',
            page = 1,
            limit = 10,
        } = req.query;

        // Build query
        const query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { metaTitle: { $regex: search, $options: 'i' } },
                { metaDescription: { $regex: search, $options: 'i' } },
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = order.toLowerCase() === 'desc' ? -1 : 1;

        // Execute query
        const categories = await Category.find(query)
            .sort({ [sort]: sortDirection })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalCategories = await Category.countDocuments(query);

        const pagination = {
            total: totalCategories,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(totalCategories / parseInt(limit)),
        };

        return successResponse(res, {
            message: 'Categories retrieved successfully',
            data: categories,
            pagination,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to retrieve categories', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Get a single category by ID
 */
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid category ID' }, 400);
        }

        const category = await Category.findById(id);

        if (!category) {
            return errorResponse(res, { message: 'Category not found' }, 404);
        }

        return successResponse(res, {
            message: 'Category retrieved successfully',
            data: category,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to retrieve category', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Update a category
 */
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid category ID' }, 400);
        }

        // Validate request body
        const validatedData = await updateCategorySchema.validateAsync(
            req.body,
        );

        // Check if category exists
        const category = await Category.findById(id);
        if (!category) {
            return errorResponse(res, { message: 'Category not found' }, 404);
        }

        // Check for name uniqueness if name is being updated
        if (validatedData.name && validatedData.name !== category.name) {
            const existingCategory = await Category.findOne({
                name: {
                    $regex: new RegExp(`^${validatedData.name.trim()}$`, 'i'),
                },
                _id: { $ne: id },
            });

            if (existingCategory) {
                return errorResponse(
                    res,
                    {
                        message: 'A category with this name already exists',
                    },
                    409,
                );
            }
        }

        // Update the category
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            validatedData,
            { new: true, runValidators: true },
        );

        return successResponse(res, {
            message: 'Category updated successfully',
            data: updatedCategory,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to update category', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

/**
 * Delete a category
 */
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid category ID' }, 400);
        }

        // Check if category exists
        const category = await Category.findById(id);
        if (!category) {
            return errorResponse(res, { message: 'Category not found' }, 404);
        }

        // Check if category is used in services
        // Note: You'll need to adjust this based on your actual Service model
        try {
            if (mongoose.connection.models['Service']) {
              
                const serviceCount = await Service.countDocuments({
                    categoryId: id,
                });

                if (serviceCount > 0) {
                    return errorResponse(
                        res,
                        {
                            message:
                                'Cannot delete category that is being used by services. Please reassign or delete associated services first.',
                        },
                        400,
                    );
                }
            }
        } catch (err) {
            logger.error('Service model check error:', err);
        }

        // Delete the category
        await Category.findByIdAndDelete(id);

        return successResponse(res, {
            message: 'Category deleted successfully',
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to delete category', error: error.message },
            500,
            error,
        );
    }
};

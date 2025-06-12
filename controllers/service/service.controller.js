import Service from '../../models/service.model.js';
import Category from '../../models/category.model.js';
import Garage from '../../models/garage.model.js';
import mongoose from 'mongoose';
import {
    errorResponse,
    successResponse,
} from '../../helpers/general.helper.js';
import { createServiceSchema } from '../../validators/serviceValidators/service.validator.js';

/**
 * Create a new service
 */
export const createService = async (req, res) => {
    try {
        // Validate request body
        const validatedData = await createServiceSchema.validateAsync(req.body);
        console.log(validatedData, 'this is');

        // Check if category exists
        if (!mongoose.Types.ObjectId.isValid(validatedData.category)) {
            return errorResponse(res, { message: 'Invalid category ID' }, 400);
        }

        const category = await Category.findById(validatedData.category);
        if (!category) {
            return errorResponse(res, { message: 'Category not found' }, 404);
        }

        // Check if garage exists
        if (!mongoose.Types.ObjectId.isValid(validatedData.garage)) {
            return errorResponse(res, { message: 'Invalid garage ID' }, 400);
        }

        const garage = await Garage.findById(validatedData.garage);
        if (!garage) {
            return errorResponse(res, { message: 'Garage not found' }, 404);
        }

        // // Check if user has permission for this garage
        // if (
        //     req.user.userType !== 'superadmin' &&
        //     req.user.garage?.toString() !== validatedData.garage.toString()
        // ) {
        //     return errorResponse(
        //         res,
        //         {
        //             message:
        //                 'You do not have permission to add services to this garage',
        //         },
        //         403,
        //     );
        // }

        // Validate time slots if provided
        if (
            validatedData.availableTimeSlots &&
            validatedData.availableTimeSlots.length > 0
        ) {
            for (const slot of validatedData.availableTimeSlots) {
                const { open, close } = slot;

                // Convert time strings to minutes for comparison
                const openMinutes =
                    parseInt(open.split(':')[0]) * 60 +
                    parseInt(open.split(':')[1]);
                const closeMinutes =
                    parseInt(close.split(':')[0]) * 60 +
                    parseInt(close.split(':')[1]);

                if (closeMinutes <= openMinutes) {
                    return errorResponse(
                        res,
                        {
                            message: 'Close time must be after open time',
                            day: slot.day,
                        },
                        400,
                    );
                }
            }
        }

        // Create new service without using transactions
        // Step 1: Create the service
        const newService = new Service(validatedData);
        await newService.save();

        // Step 2: Update the garage to include this service ID in servicesOffered array
        await Garage.findByIdAndUpdate(validatedData.garage, {
            $addToSet: { servicesOffered: newService._id },
        });

        // Populate category and garage for response
        const populatedService = await Service.findById(newService._id)
            .populate('category', 'name')
            .populate('garage', 'name address');

        return successResponse(
            res,
            {
                message: 'Service created successfully',
                data: populatedService,
            },
            201,
        );
    } catch (error) {
        console.error('Service creation error:', error);
        return errorResponse(
            res,
            { message: 'Failed to create service', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

/**
 * List services with filtering and pagination
 */
export const listServices = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            searchTerm,
            category,
            garage,
            isActive,
            minPrice,
            maxPrice,
            sortField = 'createdAt',
            sortOrder = '-1',
        } = req.query;

        // Build query
        const query = {};

        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
            ];
        }

        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return errorResponse(
                    res,
                    { message: 'Invalid category ID' },
                    400,
                );
            }
            query.category = category;
        }

        if (garage) {
            if (!mongoose.Types.ObjectId.isValid(garage)) {
                return errorResponse(
                    res,
                    { message: 'Invalid garage ID' },
                    400,
                );
            }
            query.garage = garage;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true' || isActive === true;
        }

        if (minPrice !== undefined) {
            query.price = { ...query.price, $gte: parseFloat(minPrice) };
        }

        if (maxPrice !== undefined) {
            query.price = { ...query.price, $lte: parseFloat(maxPrice) };
        }

        // For garage owners, restrict to their own garage
        if (
            req.user &&
            req.user.userType === 'garageOwner' &&
            req.user.garage
        ) {
            query.garage = req.user.garage;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Validate sort field
        const allowedSortFields = ['name', 'price', 'duration', 'createdAt'];
        const actualSortField = allowedSortFields.includes(sortField)
            ? sortField
            : 'createdAt';

        // Execute query
        const services = await Service.find(query)
            .populate('category', 'name')
            .populate('garage', 'name address')
            .sort({ [actualSortField]: parseInt(sortOrder) })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalServices = await Service.countDocuments(query);

        const pagination = {
            page: parseInt(page),
            nextPage:
                skip + parseInt(limit) < totalServices
                    ? parseInt(page) + 1
                    : null,
            previousPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
            totalPages: Math.ceil(totalServices / parseInt(limit)),
            pageSize: parseInt(limit),
            totalCount: totalServices,
        };

        return successResponse(res, {
            message: 'Services retrieved successfully',
            data: services,
            pagination,
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

/**
 * Get service detail by ID
 */
export const getServiceDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid service ID' }, 400);
        }

        const service = await Service.findById(id)
            .populate('category', 'name description')
            .populate('garage', 'name address phone email');

        if (!service) {
            return errorResponse(res, { message: 'Service not found' }, 404);
        }

        // For garage owners, restrict to their own garage
        if (
            req.user &&
            req.user.userType === 'garageOwner' &&
            req.user.garage &&
            req.user.garage.toString() !== service.garage._id.toString()
        ) {
            return errorResponse(
                res,
                { message: 'You do not have permission to view this service' },
                403,
            );
        }

        return successResponse(res, {
            message: 'Service details retrieved successfully',
            data: service,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to retrieve service', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Update a service
 */
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid service ID' }, 400);
        }

        // Validate request body
        const validatedData = await updateServiceSchema.validateAsync(req.body);

        // Check if service exists
        const service = await Service.findById(id);
        if (!service) {
            return errorResponse(res, { message: 'Service not found' }, 404);
        }

        // For garage owners, restrict to their own garage
        if (
            req.user.userType !== 'superadmin' &&
            req.user.garage?.toString() !== service.garage.toString()
        ) {
            return errorResponse(
                res,
                {
                    message:
                        'You do not have permission to update this service',
                },
                403,
            );
        }

        // Check if category exists if provided
        if (validatedData.category) {
            if (!mongoose.Types.ObjectId.isValid(validatedData.category)) {
                return errorResponse(
                    res,
                    { message: 'Invalid category ID' },
                    400,
                );
            }

            const category = await Category.findById(validatedData.category);
            if (!category) {
                return errorResponse(
                    res,
                    { message: 'Category not found' },
                    404,
                );
            }
        }

        // Validate time slots if provided
        if (
            validatedData.availableTimeSlots &&
            validatedData.availableTimeSlots.length > 0
        ) {
            // Check for duplicate days
            const days = validatedData.availableTimeSlots.map(
                (slot) => slot.day,
            );
            const uniqueDays = new Set(days);
            if (days.length !== uniqueDays.size) {
                return errorResponse(
                    res,
                    { message: 'Duplicate days found in time slots' },
                    400,
                );
            }

            for (const slot of validatedData.availableTimeSlots) {
                if (slot.isClosed) continue; // Skip validation for closed days

                const { open, close } = slot;

                // Convert time strings to minutes for comparison
                const openMinutes =
                    parseInt(open.split(':')[0]) * 60 +
                    parseInt(open.split(':')[1]);
                const closeMinutes =
                    parseInt(close.split(':')[0]) * 60 +
                    parseInt(close.split(':')[1]);

                if (closeMinutes <= openMinutes) {
                    return errorResponse(
                        res,
                        {
                            message: 'Close time must be after open time',
                            day: slot.day,
                        },
                        400,
                    );
                }
            }
        }

        // Handle garage changes without transactions
        if (
            validatedData.garage &&
            validatedData.garage !== service.garage.toString()
        ) {
            // Remove service from old garage
            await Garage.findByIdAndUpdate(service.garage, {
                $pull: { servicesOffered: service._id },
            });

            // Add service to new garage
            await Garage.findByIdAndUpdate(validatedData.garage, {
                $addToSet: { servicesOffered: service._id },
            });
        }

        // Update the service
        const updatedService = await Service.findByIdAndUpdate(
            id,
            validatedData,
            { new: true, runValidators: true },
        )
            .populate('category', 'name')
            .populate('garage', 'name address');

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

/**
 * Delete a service
 */
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid service ID' }, 400);
        }

        // Check if service exists
        const service = await Service.findById(id);
        if (!service) {
            return errorResponse(res, { message: 'Service not found' }, 404);
        }

        // For garage owners, restrict to their own garage
        if (
            req.user.userType !== 'superadmin' &&
            req.user.garage?.toString() !== service.garage.toString()
        ) {
            return errorResponse(
                res,
                {
                    message:
                        'You do not have permission to delete this service',
                },
                403,
            );
        }

        // Check if service is associated with any bookings
        // This will depend on your booking model structure
        // For example:
        /*
        const hasBookings = await Booking.exists({ 'services.service': id });
        if (hasBookings) {
            return errorResponse(res, { 
                message: 'Cannot delete service with associated bookings. Consider setting it to inactive instead.' 
            }, 400);
        }
        */

        // Remove service ID from garage's servicesOffered array
        await Garage.findByIdAndUpdate(service.garage, {
            $pull: { servicesOffered: service._id },
        });

        // Delete the service
        await Service.findByIdAndDelete(id);

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

/**
 * Get services by garage ID
 */
export const getServicesByGarage = async (req, res) => {
    try {
        const { garageId } = req.params;
        const { isActive } = req.query;

        if (!mongoose.Types.ObjectId.isValid(garageId)) {
            return errorResponse(res, { message: 'Invalid garage ID' }, 400);
        }

        // Check if garage exists
        const garage = await Garage.findById(garageId);
        if (!garage) {
            return errorResponse(res, { message: 'Garage not found' }, 404);
        }

        // Build query
        const query = { garage: garageId };

        if (isActive !== undefined) {
            query.isActive = isActive === 'true' || isActive === true;
        }

        // Get services for the garage
        const services = await Service.find(query)
            .populate('category', 'name')
            .sort({ name: 1 })
            .lean();

        return successResponse(res, {
            message: 'Garage services retrieved successfully',
            data: services,
        });
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to retrieve garage services',
                error: error.message,
            },
            500,
            error,
        );
    }
};

import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Garage from '../models/garage.model.js';
import Service from '../models/service.model.js';
import {
    errorResponse,
    successResponse,
} from '../helpers/general.helper.js';
import {
    createBookingSchema,
    updateBookingSchema,
    filterBookingSchema,
} from '../validators/booking.validator.js';
import { USER_TYPES } from '../constants/common.constant.js';
import Booking, { BOOKING_STATUS } from '../models/booking.model.js';
import { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } from '../services/booking.service.js';
import { scheduleRemindersForBooking } from '../helpers/sendBookingRemainders.helper.js';

/**
 * Create a new booking
 */
export const createBooking = async (req, res) => {
    try {
        // Validate request data
        const validatedData = await createBookingSchema.validateAsync(req.body);

        // Get current user info
        const currentUser = req.user;

        // If regular user, they can only book for themselves
        if (
            currentUser.userType === USER_TYPES.CUSTOMER &&
            validatedData.customerId !== currentUser._id.toString()
        ) {
            return errorResponse(
                res,
                {
                    message: 'You can only create bookings for yourself',
                },
                403,
            );
        }

        // Verify customer exists
        const customer = await User.findById(validatedData.customerId);
        if (!customer) {
            return errorResponse(res, { message: 'Customer not found' }, 404);
        }

        // Verify garage exists and is active
        const garage = await Garage.findOne({
            _id: validatedData.garageId,
        });
        if (!garage) {
            return errorResponse(
                res,
                { message: 'Garage not found or inactive' },
                404,
            );
        }

        // // If garage owner, they can only create bookings for their garage
        // if (
        //     currentUser.userType === USER_TYPES.GARAGE_ADMIN &&
        //     currentUser.garage?.toString() !== validatedData.garageId
        // ) {
        //     return errorResponse(
        //         res,
        //         {
        //             message: 'You can only create bookings for your own garage',
        //         },
        //         403,
        //     );
        // }

        // Verify services exist, are active, and belong to the selected garage
        const serviceIds = validatedData.serviceIds;
        const services = await Service.find({
            _id: { $in: serviceIds },
            garage: validatedData.garageId,
            isActive: true,
        });

        if (services.length !== serviceIds.length) {
            return errorResponse(
                res,
                {
                    message:
                        'One or more services are invalid or not available at the selected garage',
                },
                400,
            );
        }

        // Calculate total duration and check if appointment fits in working hours
        // This would involve complex logic based on your business rules
        // For simplicity, we're just checking time slot validity here

        // Check if date is a valid business day
        const bookingDate = new Date(validatedData.date);
        const bookingDay = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ][bookingDate.getDay()];

        // Find a time slot for the booking day
        if (validatedData.timeSlots && validatedData.timeSlots.length > 0) {
            const timeSlotForDay = validatedData.timeSlots.find(
                (slot) => slot.day === bookingDay,
            );
            if (!timeSlotForDay || timeSlotForDay.isClosed) {
                return errorResponse(
                    res,
                    {
                        message: `The garage is not open on the selected ${bookingDay}`,
                    },
                    400,
                );
            }
        }

        // Create booking
        const newBooking = new Booking({
            ...validatedData,
            status: BOOKING_STATUS.PENDING,
            createdBy: {
                userId: currentUser._id,
                userType: currentUser.userType,
            },
        });

        await newBooking.save();

        // Send confirmation email
        try {
            await sendBookingConfirmationEmail(newBooking);
        } catch (emailError) {
            console.error('Failed to send booking email:', emailError);
            
        }

        // Return success response
        return successResponse(
            res,
            {
                message: 'Booking created successfully',
                data: await Booking.findById(newBooking._id)
                    .populate('customerId', 'name email')
                    .populate('garageId', 'name address')
                    .populate('serviceIds', 'name price duration'),
            },
            201,
        );
    } catch (error) {
        console.error('Create booking error:', error);
        return errorResponse(
            res,
            { message: 'Failed to create booking', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

/**
 * Get all bookings with filtering and pagination
 * Admin and garage owners can see all relevant bookings
 */
export const getBookings = async (req, res) => {
    try {
        // Validate filter parameters
        const validatedFilters = await filterBookingSchema.validateAsync(
            req.query,
        );

        const {
            page,
            limit,
            sortBy,
            sortOrder,
            status,
            startDate,
            endDate,
            customerId,
            garageId,
            searchTerm,
        } = validatedFilters;

        // Build query based on user type and filters
        const query = {};
        const currentUser = req.user;

        // // Restrict by user type
        // if (currentUser.userType === USER_TYPES.CUSTOMER) {
        //     // Customers can only see their own bookings
        //     query.customerId = currentUser._id;
        // } else if (currentUser.userType === USER_TYPES.GARAGE_ADMIN) {
        //     // Garage owners can only see bookings for their garage
        //     query.garageId = currentUser.garage;
        // }

        // Apply additional filters
        if (status && status !== 'all') {
            query.status = status;
        }

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            query.date = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.date = { $lte: new Date(endDate) };
        }

        if (customerId && currentUser.userType !== USER_TYPES.CUSTOMER) {
            // Only admins and garage owners can filter by customer
            query.customerId = customerId;
        }

        if (garageId && currentUser.userType === USER_TYPES.SUPERADMIN) {
            // Only admins can filter by garage
            query.garageId = garageId;
        } else if (garageId && currentUser.userType === USER_TYPES.GARAGE_ADMIN) {
            // Garage owners can only see bookings for their garage
            query.garageId = currentUser.garage;
        }

        if (searchTerm) {
            // This would require additional aggregation logic to search across related collections
            // For simplicity, we're omitting this for now
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const bookings = await Booking.find(query)
            .populate('customerId', 'name email')
            .populate('garageId', 'name address')
            .populate('serviceIds', 'name price')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Booking.countDocuments(query);

        // Prepare pagination data
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrevious = page > 1;

        return successResponse(res, {
            message: 'Bookings retrieved successfully',
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                hasNext,
                hasPrevious,
            },
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        return errorResponse(
            res,
            { message: 'Failed to retrieve bookings', error: error.message },
            error.isJoi ? 400 : 500,
            error,
        );
    }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        const booking = await Booking.findById(id)
            .populate('customerId', 'name email phone')
            .populate('garageId', 'name address phone email')
            .populate('serviceIds', 'name price duration')
            .populate('transportPartnerId', 'name phone');

        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Check permissions
        const currentUser = req.user;

        // if (
        //     currentUser.userType === USER_TYPES.CUSTOMER &&
        //     booking.customerId._id.toString() !== currentUser._id.toString()
        // ) {
        //     return errorResponse(
        //         res,
        //         { message: 'You do not have permission to view this booking' },
        //         403,
        //     );
        // }

        // if (
        //     currentUser.userType === USER_TYPES.GARAGE_ADMIN &&
        //     booking.garageId._id.toString() !== currentUser.garage?.toString()
        // ) {
        //     return errorResponse(
        //         res,
        //         { message: 'You do not have permission to view this booking' },
        //         403,
        //     );
        // }

        return successResponse(res, {
            message: 'Booking details retrieved successfully',
            data: booking,
        });
    } catch (error) {
        console.error('Get booking by ID error:', error);
        return errorResponse(
            res,
            {
                message: 'Failed to retrieve booking details',
                error: error.message,
            },
            500,
            error,
        );
    }
};

/**
 * Update booking by ID
 */
export const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        // Validate update data
        const validatedData = await updateBookingSchema.validateAsync(req.body);

        // Get booking
        const booking = await Booking.findById(id);
        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Check permissions
        const currentUser = req.user;

        // if (
        //     currentUser.userType === USER_TYPES.CUSTOMER &&
        //     booking.customerId.toString() !== currentUser._id.toString()
        // ) {
        //     return errorResponse(
        //         res,
        //         {
        //             message:
        //                 'You do not have permission to update this booking',
        //         },
        //         403,
        //     );
        // }

        // if (
        //     currentUser.userType === USER_TYPES.GARAGE_ADMIN &&
        //     booking.garageId.toString() !== currentUser.garage?.toString()
        // ) {
        //     return errorResponse(
        //         res,
        //         {
        //             message:
        //                 'You do not have permission to update this booking',
        //         },
        //         403,
        //     );
        // }

        // If updating service IDs, verify they exist and belong to the same garage
        if (validatedData.serviceIds && validatedData.serviceIds.length > 0) {
            const services = await Service.find({
                _id: { $in: validatedData.serviceIds },
                garage: booking.garageId,
                isActive: true,
            });

            if (services.length !== validatedData.serviceIds.length) {
                return errorResponse(
                    res,
                    {
                        message:
                            'One or more services are invalid or not available at this garage',
                    },
                    400,
                );
            }
        }

        // Restrict fields based on user type
        if (currentUser.userType === USER_TYPES.CUSTOMER) {
            // Customers can only update limited fields
            const allowedFields = ['pickupDrop', 'notes'];
            Object.keys(validatedData).forEach((key) => {
                if (!allowedFields.includes(key)) {
                    delete validatedData[key];
                }
            });

            // Customers cannot update status beyond cancellation
            if (
                validatedData.status &&
                validatedData.status !== BOOKING_STATUS.CANCELLED
            ) {
                delete validatedData.status;
            }

            // Check if cancellation is allowed (e.g., not too close to appointment)
            if (validatedData.status === BOOKING_STATUS.CANCELLED) {
                const now = new Date();
                const bookingDate = new Date(booking.date);
                const hoursUntilBooking =
                    (bookingDate - now) / (1000 * 60 * 60);

                if (hoursUntilBooking < 24) {
                    return errorResponse(
                        res,
                        {
                            message:
                                'Bookings cannot be cancelled less than 24 hours before the appointment',
                        },
                        400,
                    );
                }
            }
        }

        // Update booking
        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            validatedData,
            { new: true, runValidators: true },
        )
            .populate('customerId', 'name email')
            .populate('garageId', 'name address')
            .populate('serviceIds', 'name price duration');

        sendBookingStatusUpdateEmail(updatedBooking);

        return successResponse(res, {
            message: 'Booking updated successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Update booking error:', error);
        return errorResponse(
            res,
            { message: 'Failed to update booking', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

/**
 * Delete booking by ID (soft delete or restrict based on status)
 */
export const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        // Get booking
        const booking = await Booking.findById(id);
        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Check permissions
        const currentUser = req.user;

        // Only admins and garage owners can delete bookings
        if (currentUser.userType === USER_TYPES.CUSTOMER) {
            return errorResponse(
                res,
                {
                    message:
                        'Customers cannot delete bookings. Please cancel the booking instead.',
                },
                403,
            );
        }

        if (
            currentUser.userType === USER_TYPES.GARAGE_ADMIN &&
            booking.garageId.toString() !== currentUser.garage?.toString()
        ) {
            return errorResponse(
                res,
                {
                    message:
                        'You do not have permission to delete this booking',
                },
                403,
            );
        }

        // Restrict deletion based on status
        if (
            [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS].includes(
                booking.status,
            )
        ) {
            return errorResponse(
                res,
                {
                    message: `Bookings in ${booking.status} status cannot be deleted. Please cancel or complete the booking first.`,
                },
                400,
            );
        }

        

        // Delete booking
        await Booking.findByIdAndDelete(id);

        return successResponse(res, {
            message: 'Booking deleted successfully',
        });
    } catch (error) {
        console.error('Delete booking error:', error);
        return errorResponse(
            res,
            { message: 'Failed to delete booking', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        if (!Object.values(BOOKING_STATUS).includes(status)) {
            return errorResponse(
                res,
                {
                    message: `Invalid status. Must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`,
                },
                400,
            );
        }

        // Get booking
        const booking = await Booking.findById(id);
        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Check permissions
        const currentUser = req.user;

        // Customers can only cancel their own bookings
        if (currentUser.userType === USER_TYPES.CUSTOMER) {
            if (booking.customerId.toString() !== currentUser._id.toString()) {
                return errorResponse(
                    res,
                    {
                        message:
                            'You do not have permission to update this booking',
                    },
                    403,
                );
            }

            if (status !== BOOKING_STATUS.CANCELLED) {
                return errorResponse(
                    res,
                    { message: 'Customers can only cancel bookings' },
                    403,
                );
            }

            // Check if cancellation is allowed (e.g., not too close to appointment)
            const now = new Date();
            const bookingDate = new Date(booking.date);
            const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);

            if (hoursUntilBooking < 24) {
                return errorResponse(
                    res,
                    {
                        message:
                            'Bookings cannot be cancelled less than 24 hours before the appointment',
                    },
                    400,
                );
            }
        }

        // Garage owners can only update bookings for their garage
        if (
            currentUser.userType === USER_TYPES.GARAGE_ADMIN &&
            booking.garageId.toString() !== currentUser.garage?.toString()
        ) {
            return errorResponse(
                res,
                {
                    message:
                        'You do not have permission to update this booking',
                },
                403,
            );
        }

        // Validate status transition
        const isValidTransition = validateStatusTransition(
            booking.status,
            status,
        );
        if (!isValidTransition) {
            return errorResponse(
                res,
                {
                    message: `Invalid status transition from ${booking.status} to ${status}`,
                },
                400,
            );
        }

        // Update booking status
        booking.status = status;

        // If completing booking, update payment status if applicable
        if (
            status === BOOKING_STATUS.COMPLETED &&
            booking.paymentStatus === 'pending'
        ) {
            // In a real app, you might want to check payment gateway status first
            booking.paymentStatus = 'completed';
        }

        await booking.save();

        // Populate related data for response
        const updatedBooking = await Booking.findById(id)
            .populate('customerId', 'name email')
            .populate('garageId', 'name address')
            .populate('serviceIds', 'name');

        return successResponse(res, {
            message: 'Booking status updated successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Update booking status error:', error);
        return errorResponse(
            res,
            {
                message: 'Failed to update booking status',
                error: error.message,
            },
            500,
            error,
        );
    }
};

/**
 * Helper function to validate status transitions
 */
function validateStatusTransition(currentStatus, newStatus) {
    // Define allowed transitions
    const allowedTransitions = {
        [BOOKING_STATUS.PENDING]: [
            BOOKING_STATUS.CONFIRMED,
            BOOKING_STATUS.CANCELLED,
        ],
        [BOOKING_STATUS.CONFIRMED]: [
            BOOKING_STATUS.IN_PROGRESS,
            BOOKING_STATUS.CANCELLED,
        ],
        [BOOKING_STATUS.IN_PROGRESS]: [
            BOOKING_STATUS.COMPLETED,
            BOOKING_STATUS.CANCELLED,
        ],
        [BOOKING_STATUS.COMPLETED]: [], // No transitions from completed
        [BOOKING_STATUS.CANCELLED]: [], // No transitions from cancelled
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
}

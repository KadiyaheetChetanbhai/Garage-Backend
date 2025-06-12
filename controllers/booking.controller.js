import Booking, { BOOKING_STATUS } from '../models/booking.model.js';
import Service from '../models/service.model.js';
import Garage from '../models/garage.model.js';
import { errorResponse, successResponse } from '../helpers/general.helper.js';
import mongoose from 'mongoose';
import { USER_TYPES, DAYS_OF_WEEK } from '../constants/common.constant.js';
import {
    sendBookingConfirmationEmail,
    sendBookingStatusUpdateEmail,
} from '../services/booking.service.js';

import { createReview } from '../services/review.service.js';
import {
    getBookingAnalytics,
    getGaragePerformanceAnalytics,
} from '../services/analytics.service.js';

// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const {
            garageId,
            serviceIds,
            date,
            selectedDay,
            selectedTimeSlot,
            pickupDrop,
        } = req.body;

        // Validate required fields
        if (
            !garageId ||
            !serviceIds ||
            !Array.isArray(serviceIds) ||
            serviceIds.length === 0 ||
            !date ||
            !selectedDay ||
            !selectedTimeSlot
        ) {
            return errorResponse(
                res,
                { message: 'Missing required fields' },
                400,
            );
        }

        // Validate garage exists
        const garage = await Garage.findById(garageId);
        if (!garage) {
            return errorResponse(res, { message: 'Garage not found' }, 404);
        }

        // Find the time slot for the selected day
        const dayTimeSlot = garage.timeSlots.find(
            (slot) => slot.day === selectedDay,
        );
        if (!dayTimeSlot) {
            return errorResponse(
                res,
                { message: 'Selected day is not available' },
                400,
            );
        }

        if (dayTimeSlot.isClosed) {
            return errorResponse(
                res,
                { message: 'Garage is closed on selected day' },
                400,
            );
        }

        // Check if time slot is within opening hours
        const [selectedHour, selectedMinute] = selectedTimeSlot
            .split(':')
            .map(Number);
        const [openingHour, openingMinute] = dayTimeSlot.open
            .split(':')
            .map(Number);
        const [closingHour, closingMinute] = dayTimeSlot.close
            .split(':')
            .map(Number);

        const selectedTime = selectedHour * 60 + selectedMinute;
        const openingTime = openingHour * 60 + openingMinute;
        const closingTime = closingHour * 60 + closingMinute;

        if (selectedTime < openingTime || selectedTime >= closingTime) {
            return errorResponse(
                res,
                { message: 'Selected time is outside operating hours' },
                400,
            );
        }

        // Check if time slot is already booked
        // First, create a booking date from the selected date and time
        const bookingDate = new Date(date);
        bookingDate.setHours(selectedHour, selectedMinute, 0, 0);

        // Check for overlapping bookings
        const existingBooking = await Booking.findOne({
            garageId,
            date: {
                $gte: new Date(bookingDate.getTime() - 30 * 60000), // 30 minutes before
                $lt: new Date(bookingDate.getTime() + 60 * 60000), // 1 hour after (assuming 1h service)
            },
            status: { $ne: BOOKING_STATUS.CANCELLED },
        });

        if (existingBooking) {
            return errorResponse(
                res,
                { message: 'This time slot is already booked' },
                400,
            );
        }

        // Validate services exist and belong to the garage
        const services = await Service.find({
            _id: { $in: serviceIds },
            garage: garageId,
            isActive: true,
        });

        if (services.length !== serviceIds.length) {
            return errorResponse(
                res,
                { message: 'One or more services not found or not active' },
                404,
            );
        }

        // Calculate total amount
        const totalAmount = services.reduce(
            (sum, service) => sum + service.price,
            0,
        );

        // Create booking
        const customerId =
            req.userType === USER_TYPES.USER ? req.userId : req.body.customerId;

        // If garage admin is creating booking, validate customerId is provided
        if (req.userType === USER_TYPES.GARAGE_ADMIN && !customerId) {
            return errorResponse(
                res,
                { message: 'Customer ID is required' },
                400,
            );
        }

        const newBooking = new Booking({
            customerId,
            garageId,
            serviceIds,
            date: bookingDate,
            selectedDay,
            selectedTimeSlot,
            pickupDrop,
            totalAmount,
            createdBy: {
                userId: req.userId,
                userType: req.userType,
            },
        });

        await newBooking.save();

        // Send booking confirmation email
        await sendBookingConfirmationEmail(newBooking);

        return successResponse(
            res,
            {
                message: 'Booking created successfully',
                data: newBooking,
            },
            201,
        );
    } catch (error) {
        console.error('Error creating booking:', error);
        return errorResponse(
            res,
            { message: 'Error creating booking', error: error.message },
            500,
        );
    }
};

// Get all bookings (with filtering)
export const getBookings = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            fromDate,
            toDate,
            sortField = 'createdAt',
            sortOrder = -1,
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query based on user type
        let query = {};

        // For normal users, only show their own bookings
        if (req.userType === USER_TYPES.USER) {
            query.customerId = req.userId;
        }
        // For garage admins, only show their garage's bookings
        else if (req.userType === USER_TYPES.GARAGE_ADMIN) {
            // First get the garage for this admin
            const garage = await Garage.findOne({ ownerId: req.userId });
            if (!garage) {
                return errorResponse(
                    res,
                    { message: 'No garage found for this admin' },
                    404,
                );
            }
            query.garageId = garage._id;
        }

        // Apply filters
        if (status) {
            query.status = status;
        }

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        // Count total documents
        const totalCount = await Booking.countDocuments(query);

        // Get bookings
        const bookings = await Booking.find(query)
            .sort({ [sortField]: parseInt(sortOrder) })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('customerId', 'name email')
            .populate('garageId', 'name address timeSlots')
            .populate('serviceIds', 'name price duration')
            .exec();

        // Calculate pagination
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const pagination = {
            page: parseInt(page),
            totalPages,
            totalCount,
            pageSize: parseInt(limit),
            nextPage: parseInt(page) < totalPages ? parseInt(page) + 1 : null,
            previousPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        };

        return successResponse(res, {
            message: 'Bookings retrieved successfully',
            data: bookings,
            pagination,
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return errorResponse(
            res,
            { message: 'Error fetching bookings', error: error.message },
            500,
        );
    }
};

// Get a single booking by ID
export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        const booking = await Booking.findById(id)
            .populate('customerId', 'name email')
            .populate('garageId', 'name address phone timeSlots')
            .populate('serviceIds', 'name price duration')
            .exec();

        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Check if user is authorized to view this booking
        if (
            req.userType === USER_TYPES.USER &&
            booking.customerId._id.toString() !== req.userId
        ) {
            return errorResponse(
                res,
                { message: 'You are not authorized to view this booking' },
                403,
            );
        } else if (req.userType === USER_TYPES.GARAGE_ADMIN) {
            // Verify the garage admin owns this garage
            const garage = await Garage.findOne({
                _id: booking.garageId,
                ownerId: req.userId,
            });
            if (!garage) {
                return errorResponse(
                    res,
                    { message: 'You are not authorized to view this booking' },
                    403,
                );
            }
        }

        return successResponse(res, {
            message: 'Booking retrieved successfully',
            data: booking,
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        return errorResponse(
            res,
            { message: 'Error fetching booking', error: error.message },
            500,
        );
    }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        // Validate status
        if (!Object.values(BOOKING_STATUS).includes(status)) {
            return errorResponse(
                res,
                {
                    message: 'Invalid status',
                    validStatuses: Object.values(BOOKING_STATUS),
                },
                400,
            );
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Authorization checks
        if (req.userType === USER_TYPES.USER) {
            // Users can only cancel their own bookings
            if (booking.customerId.toString() !== req.userId) {
                return errorResponse(
                    res,
                    {
                        message:
                            'You are not authorized to update this booking',
                    },
                    403,
                );
            }

            // Users can only cancel bookings
            if (status !== BOOKING_STATUS.CANCELLED) {
                return errorResponse(
                    res,
                    { message: 'Users can only cancel bookings' },
                    403,
                );
            }

            // Cannot cancel if already completed
            if (booking.status === BOOKING_STATUS.COMPLETED) {
                return errorResponse(
                    res,
                    { message: 'Cannot cancel a completed booking' },
                    400,
                );
            }
        } else if (req.userType === USER_TYPES.GARAGE_ADMIN) {
            // Verify the garage admin owns this garage
            const garage = await Garage.findOne({
                _id: booking.garageId,
                ownerId: req.userId,
            });
            if (!garage) {
                return errorResponse(
                    res,
                    {
                        message:
                            'You are not authorized to update this booking',
                    },
                    403,
                );
            }
        }

        // Update booking
        booking.status = status;
        if (notes) {
            booking.notes = notes;
        }

        await booking.save();

        // Send status update email
        await sendBookingStatusUpdateEmail(booking);

        return successResponse(res, {
            message: 'Booking status updated successfully',
            data: booking,
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        return errorResponse(
            res,
            { message: 'Error updating booking', error: error.message },
            500,
        );
    }
};

// Update booking details - Only for garage admin
export const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            serviceIds,
            date,
            selectedDay,
            selectedTimeSlot,
            pickupDrop,
            notes,
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Only garage admins can update booking details
        if (
            req.userType !== USER_TYPES.GARAGE_ADMIN &&
            req.userType !== USER_TYPES.SUPERADMIN
        ) {
            return errorResponse(
                res,
                { message: 'Only garage admins can update booking details' },
                403,
            );
        }

        if (req.userType === USER_TYPES.GARAGE_ADMIN) {
            // Verify the garage admin owns this garage
            const garage = await Garage.findOne({
                _id: booking.garageId,
                ownerId: req.userId,
            });
            if (!garage) {
                return errorResponse(
                    res,
                    {
                        message:
                            'You are not authorized to update this booking',
                    },
                    403,
                );
            }
        }

        // Cannot update completed or cancelled bookings
        if (
            booking.status === BOOKING_STATUS.COMPLETED ||
            booking.status === BOOKING_STATUS.CANCELLED
        ) {
            return errorResponse(
                res,
                { message: 'Cannot update completed or cancelled bookings' },
                400,
            );
        }

        // Update fields if provided
        if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
            // Validate services exist and belong to the garage
            const services = await Service.find({
                _id: { $in: serviceIds },
                garage: booking.garageId,
                isActive: true,
            });

            if (services.length !== serviceIds.length) {
                return errorResponse(
                    res,
                    { message: 'One or more services not found or not active' },
                    404,
                );
            }

            booking.serviceIds = serviceIds;

            // Recalculate total amount
            booking.totalAmount = services.reduce(
                (sum, service) => sum + service.price,
                0,
            );
        }

        // If date, day or time slot is being updated
        if (date || selectedDay || selectedTimeSlot) {
            // Get the latest garage data
            const garage = await Garage.findById(booking.garageId);
            if (!garage) {
                return errorResponse(res, { message: 'Garage not found' }, 404);
            }

            // If only date is changing but not day/time
            const newSelectedDay = selectedDay || booking.selectedDay;
            const newSelectedTimeSlot =
                selectedTimeSlot || booking.selectedTimeSlot;
            const newDate = date ? new Date(date) : new Date(booking.date);

            // Find the time slot for the selected day
            const dayTimeSlot = garage.timeSlots.find(
                (slot) => slot.day === newSelectedDay,
            );
            if (!dayTimeSlot) {
                return errorResponse(
                    res,
                    { message: 'Selected day is not available' },
                    400,
                );
            }

            if (dayTimeSlot.isClosed) {
                return errorResponse(
                    res,
                    { message: 'Garage is closed on selected day' },
                    400,
                );
            }

            // Check if time slot is within opening hours
            const [selectedHour, selectedMinute] = newSelectedTimeSlot
                .split(':')
                .map(Number);
            const [openingHour, openingMinute] = dayTimeSlot.open
                .split(':')
                .map(Number);
            const [closingHour, closingMinute] = dayTimeSlot.close
                .split(':')
                .map(Number);

            const selectedTime = selectedHour * 60 + selectedMinute;
            const openingTime = openingHour * 60 + openingMinute;
            const closingTime = closingHour * 60 + closingMinute;

            if (selectedTime < openingTime || selectedTime >= closingTime) {
                return errorResponse(
                    res,
                    { message: 'Selected time is outside operating hours' },
                    400,
                );
            }

            // Set the booking time on the date object
            newDate.setHours(selectedHour, selectedMinute, 0, 0);

            // Check for overlapping bookings
            const existingBooking = await Booking.findOne({
                _id: { $ne: id }, // Exclude current booking
                garageId: booking.garageId,
                date: {
                    $gte: new Date(newDate.getTime() - 30 * 60000), // 30 minutes before
                    $lt: new Date(newDate.getTime() + 60 * 60000), // 1 hour after
                },
                status: { $ne: BOOKING_STATUS.CANCELLED },
            });

            if (existingBooking) {
                return errorResponse(
                    res,
                    { message: 'This time slot is already booked' },
                    400,
                );
            }

            // Update the booking date, day and time slot
            booking.date = newDate;
            booking.selectedDay = newSelectedDay;
            booking.selectedTimeSlot = newSelectedTimeSlot;
        }

        if (pickupDrop) {
            booking.pickupDrop = {
                ...booking.pickupDrop,
                ...pickupDrop,
            };
        }

        if (notes) {
            booking.notes = notes;
        }

        await booking.save();

        return successResponse(res, {
            message: 'Booking updated successfully',
            data: booking,
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        return errorResponse(
            res,
            { message: 'Error updating booking', error: error.message },
            500,
        );
    }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Only superadmin or the garage owner can delete bookings
        if (req.userType !== USER_TYPES.SUPERADMIN) {
            if (req.userType === USER_TYPES.GARAGE_ADMIN) {
                // Verify the garage admin owns this garage
                const garage = await Garage.findOne({
                    _id: booking.garageId,
                    ownerId: req.userId,
                });
                if (!garage) {
                    return errorResponse(
                        res,
                        {
                            message:
                                'You are not authorized to delete this booking',
                        },
                        403,
                    );
                }
            } else {
                return errorResponse(
                    res,
                    { message: 'Only admins can delete bookings' },
                    403,
                );
            }
        }

        await Booking.findByIdAndDelete(id);

        return successResponse(res, {
            message: 'Booking deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        return errorResponse(
            res,
            { message: 'Error deleting booking', error: error.message },
            500,
        );
    }
};

// Add review endpoints
export const submitReview = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { rating, comment, serviceQuality, valueForMoney, punctuality } =
            req.body;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return errorResponse(res, { message: 'Invalid booking ID' }, 400);
        }

        // Only users can submit reviews
        if (req.userType !== USER_TYPES.USER) {
            return errorResponse(
                res,
                { message: 'Only customers can submit reviews' },
                403,
            );
        }

        const reviewData = {
            bookingId,
            customerId: req.userId,
            rating,
            comment,
            serviceQuality,
            valueForMoney,
            punctuality,
        };

        const review = await createReview(reviewData);

        return successResponse(res, {
            message: 'Review submitted successfully',
            data: review,
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        return errorResponse(
            res,
            { message: 'Error submitting review', error: error.message },
            500,
        );
    }
};

// Add analytics endpoints
export const getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let garageId = null;

        // For garage admin, only show their garage's analytics
        if (req.userType === USER_TYPES.GARAGE_ADMIN) {
            const garage = await Garage.findOne({ ownerId: req.userId });
            if (!garage) {
                return errorResponse(
                    res,
                    { message: 'No garage found for this admin' },
                    404,
                );
            }
            garageId = garage._id;
        }

        const bookingAnalytics = await getBookingAnalytics(
            garageId,
            startDate,
            endDate,
        );
        const performanceAnalytics =
            await getGaragePerformanceAnalytics(garageId);

        return successResponse(res, {
            message: 'Analytics retrieved successfully',
            data: {
                bookings: bookingAnalytics,
                performance: performanceAnalytics,
            },
        });
    } catch (error) {
        console.error('Error retrieving analytics:', error);
        return errorResponse(
            res,
            { message: 'Error retrieving analytics', error: error.message },
            500,
        );
    }
};

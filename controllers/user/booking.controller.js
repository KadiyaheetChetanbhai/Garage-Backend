import mongoose from 'mongoose';
import Booking from '../../models/booking.model.js';
import TimeSlot from '../../models/timeSlot.model.js';
import Clinic from '../../models/clinic.model.js';
import {
    createBookingSchema,
    updateBookingSchema,
} from '../../validators/booking.validator.js';
import {
    errorResponse,
    successResponse,
} from '../../helpers/general.helper.js';
import { sendMail } from '../../mail/sendMail.js';
import User from '../../models/user.model.js';
import { scheduleRemindersForBooking } from '../../helpers/sendBookingRemainders.helper.js';

/**
 * Get available time slots for a clinic on a specific date
 * This API returns the time slots available for booking on a particular date for a clinic
 */
export const getAvailableTimeSlots = async (req, res) => {
    try {
        const { clinicId, date } = req.query;

        if (!clinicId || !date) {
            return errorResponse(
                res,
                { message: 'Clinic ID and date are required' },
                400,
            );
        }

        if (!mongoose.Types.ObjectId.isValid(clinicId)) {
            return errorResponse(res, { message: 'Invalid clinic ID' }, 400);
        }

        // Parse and validate the date
        const bookingDate = new Date(date);
        if (isNaN(bookingDate)) {
            return errorResponse(res, { message: 'Invalid date format' }, 400);
        }

        // Get the day of the week from the date (0 = Sunday, 1 = Monday, etc.)
        const dayNames = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ];
        const dayOfWeek = dayNames[bookingDate.getDay()];

        // Find the clinic and its timing for the specific day
        const clinic = await Clinic.findById(clinicId);

        if (!clinic) {
            return errorResponse(res, { message: 'Clinic not found' }, 404);
        }

        // Find the timing for the requested day
        const dayTiming = clinic.timings.find(
            (timing) => timing.day === dayOfWeek,
        );

        if (!dayTiming || dayTiming.isClosed) {
            return successResponse(
                res,
                {
                    message: 'Clinic is closed on this day',
                    data: {
                        timeSlots: [],
                        isOpen: false,
                    },
                },
                200,
            );
        }

        // Generate time slots from the clinic's opening and closing times
        const openTime = dayTiming.open;
        const closeTime = dayTiming.close;

        // Convert time strings to 24-hour format hours and minutes
        const parseTimeString = (timeStr) => {
            // Check if time is in AM/PM format
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
                let [time, period] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);

                // Convert 12-hour format to 24-hour format
                if (period === 'PM' && hours < 12) {
                    hours += 12;
                } else if (period === 'AM' && hours === 12) {
                    hours = 0;
                }

                return { hours, minutes };
            } else {
                // Assume 24-hour format
                let [hours, minutes] = timeStr.split(':').map(Number);
                return { hours, minutes };
            }
        };

        const openTimeParsed = parseTimeString(openTime);
        const closeTimeParsed = parseTimeString(closeTime);

        // Find existing time slots for this clinic and date
        const existingTimeSlots = await TimeSlot.find({
            clinic: clinicId,
            date: {
                $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
                $lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
            },
        });

        // Create a map of existing time slots for quick lookup
        const timeSlotMap = {};
        existingTimeSlots.forEach((slot) => {
            timeSlotMap[slot.timeSlot] = {
                bookedCount: slot.bookedCount,
                isAvailable: slot.bookedCount < slot.totalCapacity,
            };
        });

        // Generate all possible time slots for the day
        const timeSlots = [];
        let currentHour = openTimeParsed.hours;
        let currentMinute = openTimeParsed.minutes;

        // Generate one-hour slots
        while (
            currentHour < closeTimeParsed.hours ||
            (currentHour === closeTimeParsed.hours &&
                currentMinute < closeTimeParsed.minutes)
        ) {
            // Next slot ends one hour later
            let nextHour = currentHour + 1;
            let nextMinute = currentMinute;

            // Skip if next time exceeds close time
            if (
                nextHour > closeTimeParsed.hours ||
                (nextHour === closeTimeParsed.hours &&
                    nextMinute > closeTimeParsed.minutes)
            ) {
                break;
            }

            // Format the time slot string
            const formatTime = (h, m) => {
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            };

            const timeSlot = `${formatTime(currentHour, currentMinute)} - ${formatTime(nextHour, nextMinute)}`;

            // Check if this slot exists in our database already
            const existingSlot = timeSlotMap[timeSlot];

            timeSlots.push({
                timeSlot,
                isAvailable: existingSlot ? existingSlot.isAvailable : true,
                bookedCount: existingSlot ? existingSlot.bookedCount : 0,
                totalCapacity: 10,
            });

            // Move to the next slot
            currentHour = nextHour;
            currentMinute = nextMinute;
        }

        // Check if the booking date is today or in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of today for date comparison
        const bookingDateStart = new Date(bookingDate);
        bookingDateStart.setHours(0, 0, 0, 0); // Set to beginning of booking date for comparison

        // If booking date is in the past, all slots should be unavailable
        if (bookingDateStart < today) {
            timeSlots.forEach((slot) => {
                slot.isAvailable = false;
            });
        }
        // If booking is for today, check current time
        else if (bookingDateStart.getTime() === today.getTime()) {
            const currentHour = new Date().getHours();
            const currentMinute = new Date().getMinutes();

            // Mark all time slots that have already passed as unavailable
            timeSlots.forEach((slot) => {
                const slotStartTime = slot.timeSlot.split(' - ')[0];
                const slotTimeParts = slotStartTime.split(':').map(Number);
                const slotHour = slotTimeParts[0];
                const slotMinute = slotTimeParts[1];

                // If the slot's start time has already passed, mark it as unavailable
                if (
                    slotHour < currentHour ||
                    (slotHour === currentHour && slotMinute <= currentMinute)
                ) {
                    slot.isAvailable = false;
                }
            });
        }

        return successResponse(
            res,
            {
                message: 'Time slots retrieved successfully',
                data: {
                    timeSlots,
                    isOpen: true,
                    openTime,
                    closeTime,
                },
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error retrieving time slots', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Create a new booking
 * This API creates a new booking for a clinic's service
 */
export const createBooking = async (req, res) => {
    try {
        const bookingData = await createBookingSchema.validateAsync(req.body);

        // Check if the clinic exists
        const clinic = await Clinic.findById(bookingData.clinic);
        if (!clinic) {
            return errorResponse(res, { message: 'Clinic not found' }, 404);
        }

        // Parse the date
        const bookingDate = new Date(bookingData.date);

        // Get the day of the week
        const dayNames = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ];
        const dayOfWeek = dayNames[bookingDate.getDay()];

        // Find the timing for the requested day
        const dayTiming = clinic.timings.find(
            (timing) => timing.day === dayOfWeek,
        );

        if (!dayTiming || dayTiming.isClosed) {
            return errorResponse(
                res,
                { message: 'Clinic is closed on this day' },
                400,
            );
        }

        // Parse time strings to check if the time slot is within clinic hours
        const parseTimeString = (timeStr) => {
            // Check if time is in AM/PM format
            if (timeStr.includes('AM') || timeStr.includes('PM')) {
                let [time, period] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);

                // Convert 12-hour format to 24-hour format
                if (period === 'PM' && hours < 12) {
                    hours += 12;
                } else if (period === 'AM' && hours === 12) {
                    hours = 0;
                }

                return { hours, minutes };
            } else {
                // Assume 24-hour format
                let [hours, minutes] = timeStr.split(':').map(Number);
                return { hours, minutes };
            }
        };

        const openTimeParsed = parseTimeString(dayTiming.open);
        const closeTimeParsed = parseTimeString(dayTiming.close);

        // Parse the selected time slot
        const slotStartTime = bookingData.timeSlot.split(' - ')[0];
        const slotStartParsed = parseTimeString(slotStartTime);

        // Check if the time slot is within clinic hours
        const isSlotBeforeOpen =
            slotStartParsed.hours < openTimeParsed.hours ||
            (slotStartParsed.hours === openTimeParsed.hours &&
                slotStartParsed.minutes < openTimeParsed.minutes);

        const isSlotAfterClose =
            slotStartParsed.hours > closeTimeParsed.hours ||
            (slotStartParsed.hours === closeTimeParsed.hours &&
                slotStartParsed.minutes >= closeTimeParsed.minutes);

        if (isSlotBeforeOpen || isSlotAfterClose) {
            return errorResponse(
                res,
                { message: 'Selected time slot is outside clinic hours' },
                400,
            );
        }

        // Check if the booking is for today and the time slot has already passed
        const today = new Date();
        const isBookingForToday =
            bookingDate.getFullYear() === today.getFullYear() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getDate() === today.getDate();

        if (isBookingForToday) {
            const currentHour = today.getHours();
            const currentMinute = today.getMinutes();

            if (
                slotStartParsed.hours < currentHour ||
                (slotStartParsed.hours === currentHour &&
                    slotStartParsed.minutes <= currentMinute)
            ) {
                return errorResponse(
                    res,
                    {
                        message:
                            'Cannot book a time slot that has already passed',
                    },
                    400,
                );
            }
        }

        // Set up the date range for finding time slots
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Find or create the time slot
        let timeSlot = await TimeSlot.findOne({
            clinic: bookingData.clinic,
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            timeSlot: bookingData.timeSlot,
        });

        if (!timeSlot) {
            // Create a new time slot
            timeSlot = new TimeSlot({
                clinic: bookingData.clinic,
                date: bookingData.date,
                timeSlot: bookingData.timeSlot,
                bookedCount: 0,
                isAvailable: true,
            });
        }

        // Check if the slot is available
        if (timeSlot.bookedCount >= timeSlot.totalCapacity) {
            return errorResponse(
                res,
                { message: 'Selected time slot is fully booked' },
                400,
            );
        }

        // Increment the booked count
        timeSlot.bookedCount += 1;

        // Check if the slot is now full
        if (timeSlot.bookedCount >= timeSlot.totalCapacity) {
            timeSlot.isAvailable = false;
        }

        await timeSlot.save();

        // Create the booking
        const newBooking = new Booking({
            ...bookingData,
            userId: null, // No authenticated users for now
        });

        const savedBooking = await newBooking.save();

        scheduleRemindersForBooking(savedBooking);

        // Populate service details for email
        const populatedBooking = await Booking.findById(savedBooking._id)
            .populate('services', 'serviceName')
            .lean();

        const admins = await User.find({
            userType: 'Admin',
            email: { $ne: null },
        }).select('email');

        const adminEmails = admins
            .map((admin) => admin.email)
            .filter((email) => !!email);

        // Send email to all admin
        if (adminEmails.length > 0) {
            for (const email of adminEmails) {
                sendMail({
                    to: email,
                    subject: 'New Booking Alert',
                    type: 'bookingAdminNotification',
                    data: {
                        ...populatedBooking,
                        serviceDetails: populatedBooking.services,
                        adminPortalUrl: process.env.ADMIN_PORTAL_URL,
                    },
                });
            }
        }

        // Send confirmation email to user
        sendMail({
            to: bookingData.customerDetails.email,
            subject: 'Booking Confirmed',
            type: 'bookingUserConfirmation',
            data: {
                ...populatedBooking,
                serviceDetails: populatedBooking.services,
            },
        });

        return successResponse(
            res,
            {
                message: 'Booking created successfully',
                data: savedBooking,
            },
            201,
        );
    } catch (error) {
        if (error.isJoi) {
            return errorResponse(
                res,
                { message: error.details[0].message },
                400,
                error,
            );
        }

        return errorResponse(
            res,
            { message: 'Error creating booking', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Get booking details by ID
 * This API returns details of a specific booking
 */
export const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the booking
        const booking = await Booking.findById(id)
            .populate('clinic', 'clinicName address pincode')
            .populate('services', 'serviceName');

        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        return successResponse(
            res,
            {
                message: 'Booking retrieved successfully',
                data: booking,
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error retrieving booking', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Cancel booking
 * This API allows cancelling a booking
 */
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the booking
        const booking = await Booking.findById(id);

        if (!booking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Check if the booking is already cancelled or completed
        if (booking.status === 'cancelled') {
            return errorResponse(
                res,
                { message: 'Booking is already cancelled' },
                400,
            );
        }

        if (booking.status === 'completed') {
            return errorResponse(
                res,
                { message: 'Cannot cancel a completed booking' },
                400,
            );
        }

        // Set up the date range for finding time slots
        const bookingDate = new Date(booking.date);
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Update the time slot to reduce the booked count
        const timeSlot = await TimeSlot.findOne({
            clinic: booking.clinic,
            date: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
            timeSlot: booking.timeSlot,
        });

        if (timeSlot) {
            timeSlot.bookedCount = Math.max(0, timeSlot.bookedCount - 1);
            timeSlot.isAvailable = true;
            await timeSlot.save();
        }

        // Update booking status to cancelled
        booking.status = 'cancelled';
        await booking.save();

        return successResponse(
            res,
            {
                message: 'Booking cancelled successfully',
                data: booking,
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error cancelling booking', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Update an existing booking
 * This API updates an existing booking with new details
 */
export const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = await updateBookingSchema.validateAsync(req.body);

        // Find the existing booking
        const existingBooking = await Booking.findById(id);
        if (!existingBooking) {
            return errorResponse(res, { message: 'Booking not found' }, 404);
        }

        // Check if the booking can be updated
        if (
            existingBooking.status === 'completed' ||
            existingBooking.status === 'cancelled'
        ) {
            return errorResponse(
                res,
                {
                    message: `Cannot update a booking that is already ${existingBooking.status}`,
                },
                400,
            );
        }

        // Check if the clinic exists if clinic is being updated
        if (updateData.clinic) {
            const clinic = await Clinic.findById(updateData.clinic);
            if (!clinic) {
                return errorResponse(res, { message: 'Clinic not found' }, 404);
            }
        }

        // Check if date or timeSlot is being changed
        const isTimeChanged = updateData.date || updateData.timeSlot;

        if (isTimeChanged) {
            // Use either the new values or existing values
            const bookingDate = updateData.date
                ? new Date(updateData.date)
                : new Date(existingBooking.date);
            const clinicId = updateData.clinic || existingBooking.clinic;
            const timeSlot = updateData.timeSlot || existingBooking.timeSlot;

            // Get the day of the week
            const dayNames = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
            ];
            const dayOfWeek = dayNames[bookingDate.getDay()];

            // Find the clinic and check if it's open on the requested day
            const clinic = await Clinic.findById(clinicId);
            const dayTiming = clinic.timings.find(
                (timing) => timing.day === dayOfWeek,
            );

            if (!dayTiming || dayTiming.isClosed) {
                return errorResponse(
                    res,
                    { message: 'Clinic is closed on this day' },
                    400,
                );
            }

            // Parse time strings to check if the time slot is within clinic hours
            const parseTimeString = (timeStr) => {
                // Check if time is in AM/PM format
                if (timeStr.includes('AM') || timeStr.includes('PM')) {
                    let [time, period] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);

                    // Convert 12-hour format to 24-hour format
                    if (period === 'PM' && hours < 12) {
                        hours += 12;
                    } else if (period === 'AM' && hours === 12) {
                        hours = 0;
                    }

                    return { hours, minutes };
                } else {
                    // Assume 24-hour format
                    let [hours, minutes] = timeStr.split(':').map(Number);
                    return { hours, minutes };
                }
            };

            const openTimeParsed = parseTimeString(dayTiming.open);
            const closeTimeParsed = parseTimeString(dayTiming.close);

            // Parse the selected time slot
            const slotStartTime = timeSlot.split(' - ')[0];
            const slotStartParsed = parseTimeString(slotStartTime);

            // Check if the time slot is within clinic hours
            const isSlotBeforeOpen =
                slotStartParsed.hours < openTimeParsed.hours ||
                (slotStartParsed.hours === openTimeParsed.hours &&
                    slotStartParsed.minutes < openTimeParsed.minutes);

            const isSlotAfterClose =
                slotStartParsed.hours > closeTimeParsed.hours ||
                (slotStartParsed.hours === closeTimeParsed.hours &&
                    slotStartParsed.minutes >= closeTimeParsed.minutes);

            if (isSlotBeforeOpen || isSlotAfterClose) {
                return errorResponse(
                    res,
                    { message: 'Selected time slot is outside clinic hours' },
                    400,
                );
            }

            // Check if the booking is for today and the time slot has already passed
            const today = new Date();
            const isBookingForToday =
                bookingDate.getFullYear() === today.getFullYear() &&
                bookingDate.getMonth() === today.getMonth() &&
                bookingDate.getDate() === today.getDate();

            if (isBookingForToday) {
                const currentHour = today.getHours();
                const currentMinute = today.getMinutes();

                if (
                    slotStartParsed.hours < currentHour ||
                    (slotStartParsed.hours === currentHour &&
                        slotStartParsed.minutes <= currentMinute)
                ) {
                    return errorResponse(
                        res,
                        {
                            message:
                                'Cannot book a time slot that has already passed',
                        },
                        400,
                    );
                }
            }

            // Begin transaction
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // If time is changing, update the time slots
                if (updateData.date || updateData.timeSlot) {
                    // Set up date ranges for finding time slots
                    const oldBookingDate = new Date(existingBooking.date);
                    const oldStartOfDay = new Date(oldBookingDate);
                    oldStartOfDay.setHours(0, 0, 0, 0);

                    const oldEndOfDay = new Date(oldBookingDate);
                    oldEndOfDay.setHours(23, 59, 59, 999);

                    // Decrement the count in the old time slot
                    const oldTimeSlot = await TimeSlot.findOne(
                        {
                            clinic: existingBooking.clinic,
                            date: {
                                $gte: oldStartOfDay,
                                $lt: oldEndOfDay,
                            },
                            timeSlot: existingBooking.timeSlot,
                        },
                        null,
                        { session },
                    );

                    if (oldTimeSlot) {
                        oldTimeSlot.bookedCount = Math.max(
                            0,
                            oldTimeSlot.bookedCount - 1,
                        );
                        oldTimeSlot.isAvailable = true;
                        await oldTimeSlot.save({ session });
                    }

                    // Set up date range for the new time slot
                    const newStartOfDay = new Date(bookingDate);
                    newStartOfDay.setHours(0, 0, 0, 0);

                    const newEndOfDay = new Date(bookingDate);
                    newEndOfDay.setHours(23, 59, 59, 999);

                    // Find or create the new time slot
                    let newTimeSlot = await TimeSlot.findOne(
                        {
                            clinic: clinicId,
                            date: {
                                $gte: newStartOfDay,
                                $lt: newEndOfDay,
                            },
                            timeSlot: timeSlot,
                        },
                        null,
                        { session },
                    );

                    if (!newTimeSlot) {
                        // Create a new time slot
                        newTimeSlot = new TimeSlot({
                            clinic: clinicId,
                            date: bookingDate,
                            timeSlot: timeSlot,
                            bookedCount: 0,
                            isAvailable: true,
                        });
                    }

                    // Check if the new slot is available
                    if (newTimeSlot.bookedCount >= newTimeSlot.totalCapacity) {
                        // Abort transaction
                        await session.abortTransaction();
                        session.endSession();

                        return errorResponse(
                            res,
                            { message: 'Selected time slot is fully booked' },
                            400,
                        );
                    }

                    // Increment the booked count for the new slot
                    newTimeSlot.bookedCount += 1;

                    // Check if the slot is now full
                    if (newTimeSlot.bookedCount >= newTimeSlot.totalCapacity) {
                        newTimeSlot.isAvailable = false;
                    }

                    await newTimeSlot.save({ session });
                }

                // Update the booking with the new information
                const updatedBooking = await Booking.findByIdAndUpdate(
                    id,
                    { $set: updateData },
                    { new: true, session },
                );

                // Commit the transaction
                await session.commitTransaction();
                session.endSession();

                return successResponse(
                    res,
                    {
                        message: 'Booking updated successfully',
                        data: updatedBooking,
                    },
                    200,
                );
            } catch (error) {
                // Abort transaction on error
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        } else {
            // If not changing date or time, just update the booking
            const updatedBooking = await Booking.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true },
            );

            return successResponse(
                res,
                {
                    message: 'Booking updated successfully',
                    data: updatedBooking,
                },
                200,
            );
        }
    } catch (error) {
        if (error.isJoi) {
            return errorResponse(
                res,
                { message: error.details[0].message },
                400,
                error,
            );
        }

        return errorResponse(
            res,
            { message: 'Error updating booking', error: error.message },
            500,
            error,
        );
    }
};

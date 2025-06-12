import agenda from '../agenda/agenda.js';
import logger from './logger.helper.js';

export const scheduleRemindersForBooking = async (booking) => {
    try {
        if (!booking || !booking._id) {
            logger.error(
                'Invalid booking object provided to scheduleRemindersForBooking',
            );
            return;
        }

        logger.info(`Scheduling reminders for booking ${booking._id}`);

        // Cancel any existing reminders for this booking
        await agenda.cancel({
            name: { $in: ['send 24-hour reminder', 'send 1-hour reminder'] },
            'data.bookingId': booking._id.toString(),
        });

        // Extract time from the booking object based on the new structure
        let bookingDate;
        try {
            bookingDate = new Date(booking.date);

            // If we have timeSlots, use the first non-closed slot's open time
            if (booking.timeSlots && booking.timeSlots.length > 0) {
                // Find first non-closed slot
                const activeSlot = booking.timeSlots.find(
                    (slot) => !slot.isClosed,
                );

                if (activeSlot) {
                    const timeMatch =
                        activeSlot.open.match(/(\d{1,2}):(\d{2})/);
                    if (timeMatch) {
                        const [, hours, minutes] = timeMatch;
                        bookingDate.setHours(parseInt(hours, 10));
                        bookingDate.setMinutes(parseInt(minutes, 10));
                    } else {
                        // Default to beginning of day if time format is invalid
                        bookingDate.setHours(9);
                        bookingDate.setMinutes(0);
                        logger.warn(
                            `Invalid time format in timeSlots.open for booking ${booking._id}, defaulting to 9:00 AM`,
                        );
                    }
                } else {
                    // All slots are closed? Use a reasonable default
                    bookingDate.setHours(9);
                    bookingDate.setMinutes(0);
                    logger.warn(
                        `No active time slots for booking ${booking._id}, defaulting to 9:00 AM`,
                    );
                }
            } else if (booking.selectedTimeSlot) {
                // For backward compatibility
                const timeMatch =
                    booking.selectedTimeSlot.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    const [, hours, minutes] = timeMatch;
                    bookingDate.setHours(parseInt(hours, 10));
                    bookingDate.setMinutes(parseInt(minutes, 10));
                } else {
                    bookingDate.setHours(9);
                    bookingDate.setMinutes(0);
                }
            } else {
                // No time information available, default to 9:00 AM
                bookingDate.setHours(9);
                bookingDate.setMinutes(0);
                logger.warn(
                    `No time slot information for booking ${booking._id}, defaulting to 9:00 AM`,
                );
            }

            bookingDate.setSeconds(0);
            bookingDate.setMilliseconds(0);
        } catch (error) {
            logger.error(
                `Error parsing booking date/time for booking ${booking._id}:`,
                error,
            );
            return;
        }

        // Reminder times
        const twentyFourHourBefore = new Date(
            bookingDate.getTime() - 24 * 60 * 60 * 1000,
        );
        const oneHourBefore = new Date(bookingDate.getTime() - 60 * 60 * 1000);
        const now = new Date();

        logger.info(
            `Booking date: ${bookingDate.toISOString()}, 24h before: ${twentyFourHourBefore.toISOString()}, 1h before: ${oneHourBefore.toISOString()}`,
        );

        // Schedule 24-hour reminder if still possible
        if (twentyFourHourBefore > now) {
            await agenda.schedule(
                twentyFourHourBefore,
                'send 24-hour reminder',
                {
                    bookingId: booking._id.toString(),
                },
            );
            logger.info(
                `24-hour reminder scheduled for booking ${booking._id} at ${twentyFourHourBefore}`,
            );
        } else {
            logger.info(
                `24-hour reminder time already passed for booking ${booking._id}`,
            );
        }

        // Schedule 1-hour reminder if still possible
        if (oneHourBefore > now) {
            await agenda.schedule(oneHourBefore, 'send 1-hour reminder', {
                bookingId: booking._id.toString(),
            });
            logger.info(
                `1-hour reminder scheduled for booking ${booking._id} at ${oneHourBefore}`,
            );
        }
        // If 1-hour reminder time has passed but booking is still in future, send immediately
        else if (bookingDate > now) {
            await agenda.now('send 1-hour reminder', {
                bookingId: booking._id.toString(),
            });
            logger.info(
                `1-hour reminder triggered immediately for booking ${booking._id}`,
            );
        } else {
            logger.info(
                `Booking time already passed for booking ${booking._id}, no reminders scheduled`,
            );
        }
    } catch (error) {
        logger.error(
            `Error scheduling reminders for booking ${booking?._id || 'unknown'}:`,
            error,
        );
    }
};

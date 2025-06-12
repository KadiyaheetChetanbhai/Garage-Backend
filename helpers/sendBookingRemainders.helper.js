import agenda from '../agenda/agenda.js';

export const scheduleRemindersForBooking = async (booking) => {
    try {
        // Cancel any existing reminders for this booking
        await agenda.cancel({
            name: { $in: ['send 24-hour reminder', 'send 1-hour reminder'] },
            'data.bookingId': booking._id,
        });

        // Extract time from selectedTimeSlot
        const [hours, minutes] = booking.selectedTimeSlot
            .split(':')
            .map(Number);

        const bookingDate = new Date(booking.date);
        bookingDate.setHours(hours);
        bookingDate.setMinutes(minutes);
        bookingDate.setSeconds(0);
        bookingDate.setMilliseconds(0);

        // Reminder times
        const twentyFourHourBefore = new Date(
            bookingDate.getTime() - 24 * 60 * 60 * 1000,
        );
        const oneHourBefore = new Date(bookingDate.getTime() - 60 * 60 * 1000);

        const now = new Date();

        // Schedule 24-hour reminder if still possible
        if (twentyFourHourBefore > now) {
            await agenda.schedule(
                twentyFourHourBefore,
                'send 24-hour reminder',
                {
                    bookingId: booking._id,
                },
            );
            console.log(
                `24-hour reminder scheduled for booking ${booking._id}`,
            );
        }

        // Schedule 1-hour reminder if still possible
        if (oneHourBefore > now) {
            await agenda.schedule(oneHourBefore, 'send 1-hour reminder', {
                bookingId: booking._id,
            });
            console.log(`1-hour reminder scheduled for booking ${booking._id}`);
        }
        // If 1-hour reminder time has passed but booking is still in future, send immediately
        else if (bookingDate > now) {
            await agenda.now('send 1-hour reminder', {
                bookingId: booking._id,
            });
            console.log(
                `1-hour reminder sent immediately for booking ${booking._id}`,
            );
        }
    } catch (error) {
        console.error(
            `Error scheduling reminders for booking ${booking._id}:`,
            error,
        );
    }
};

import agenda from '../agenda/agenda.js';

export const scheduleRemindersForBooking = async (booking) => {
    const [startTime] = booking.timeSlot.split(' - ');
    const [hours, minutes] = startTime.split(':').map(Number);

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
        await agenda.schedule(twentyFourHourBefore, 'send 24-hour reminder', {
            bookingId: booking._id,
        });
    }

    // Schedule or run 1-hour reminder
    if (oneHourBefore > now) {
        await agenda.schedule(oneHourBefore, 'send 1-hour reminder', {
            bookingId: booking._id,
        });
    } else {
        await agenda.now('send 1-hour reminder', {
            bookingId: booking._id,
        });
    }
};

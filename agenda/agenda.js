// agenda/agenda.js
import Agenda from 'agenda';
import logger from '../helpers/logger.helper.js';
import { sendMail } from '../mail/sendMail.js';
import Booking from '../models/booking.model.js';
import Garage from '../models/garage.model.js'; // Added garage model

const agenda = new Agenda({
    db: {
        address: process.env.MONGO_URI,
        collection: 'bookingReminders',
        options: { useUnifiedTopology: true },
    },
    processEvery: '10 seconds', // Poll jobs every 10s (adjust if needed)
    defaultLockLifetime: 2 * 60 * 1000, // 2 minutes lock time
});

agenda.on('ready', () => {
    logger.info('Agenda connected and ready');
});

agenda.on('error', (err) => {
    logger.error('Agenda error:', err);
});

export default agenda;

export const defineReminderJobs = (agenda) => {
    agenda.define('send 1-hour reminder', async (job) => {
        try {
            const { bookingId } = job.attrs.data;
            const booking = await Booking.findById(bookingId)
                .populate('customerId', 'name email phone')
                .populate('garageId', 'name address phone timeSlots')
                .populate('serviceIds', 'name price duration');

            if (!booking || booking.reminderSent.oneHour) return;

            // Get formatted date and time
            const formattedDate = new Date(booking.date).toLocaleDateString(
                'en-US',
                {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                },
            );
            const formattedTime = (() => {
                if (booking.timeSlots && booking.timeSlots.length > 0) {
                    const activeSlot = booking.timeSlots.find(
                        (slot) => !slot.isClosed,
                    );
                    return activeSlot
                        ? activeSlot.open
                        : 'Check your booking details';
                }
                return booking.selectedTimeSlot || 'Check your booking details';
            })();

            // Send email
            await sendMail({
                to: booking.customerId.email,
                subject:
                    'Your vehicle service appointment is coming up in 1 hour',
                type: 'bookingReminder',
                data: {
                    name: booking.customerId.name,
                    garageName: booking.garageId.name,
                    reminderTime: '1 hour',
                    date: formattedDate,
                    time: formattedTime,
                    address: booking.garageId.address,
                    phone: booking.garageId.phone,
                    pickupDropService: booking.pickupDrop?.opted || false,
                    pickupAddress: booking.pickupDrop?.pickupAddress || 'N/A',
                    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}`,
                    cancelUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}/cancel`,
                },
            });

            // Mark reminder as sent
            booking.reminderSent.oneHour = true;
            await booking.save();
            await job.remove();

            logger.info(`Sent 1-hour reminder for booking ${booking._id}`);
        } catch (err) {
            logger.error('Error in 1-hour reminder job:', err);
        }
    });

    agenda.define('send 24-hour reminder', async (job) => {
        try {
            const { bookingId } = job.attrs.data;
            const booking = await Booking.findById(bookingId)
                .populate('customerId', 'name email phone')
                .populate('garageId')
                .populate('timeSlot')
                .populate('serviceIds');

            if (!booking || booking.reminderSent.twentyFourHour) return;

            // Get garage details
            const garage = await Garage.findById(booking.garageId);
            if (!garage) {
                logger.error(`Garage not found for booking ${booking._id}`);
                return;
            }

            // Format services for email
            const services = booking.serviceIds.map((service) => ({
                name: service.name,
                price: service.price.toFixed(2),
                duration: service.duration,
            }));

            // Get formatted date and time
            const formattedDate = new Date(booking.date).toLocaleDateString(
                'en-US',
                {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                },
            );

            const formattedTime = (() => {
                if (booking.timeSlots && booking.timeSlots.length > 0) {
                    const activeSlot = booking.timeSlots.find(
                        (slot) => !slot.isClosed,
                    );
                    return activeSlot
                        ? activeSlot.open
                        : 'Check your booking details';
                }
                return booking.selectedTimeSlot || 'Check your booking details';
            })();

            // Send email
            await sendMail({
                to: booking.customerId.email,
                subject: 'Your vehicle service appointment is tomorrow',
                type: 'bookingReminder',
                data: {
                    name: booking.customerId.name,
                    garageName: garage.name,
                    reminderTime: '24 hours',
                    date: formattedDate,
                    time: formattedTime,
                    address: garage.address,
                    phone: garage.phone,
                    pickupDropService: booking.pickupDrop?.opted || false,
                    pickupAddress: booking.pickupDrop?.pickupAddress || 'N/A',
                    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}`,
                    cancelUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}/cancel`,
                },
            });

            // Mark reminder as sent
            booking.reminderSent.twentyFourHour = true;
            await booking.save();
            await job.remove();

            logger.info(`Sent 24-hour reminder for booking ${booking._id}`);
        } catch (err) {
            logger.error('Error in 24-hour reminder job:', err);
        }
    });
};

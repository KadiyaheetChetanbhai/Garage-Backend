import { sendMail } from '../mail/sendMail.js';
import Booking, { BOOKING_STATUS } from '../models/booking.model.js';
import User from '../models/user.model.js';
import Garage from '../models/garage.model.js';
import Service from '../models/service.model.js';
// Removed TimeSlot import
import mongoose from 'mongoose';
import logger from '../helpers/logger.helper.js';
import { scheduleRemindersForBooking } from '../helpers/sendBookingRemainders.helper.js';

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (booking) => {
    try {
        // Get user info
        const user = await User.findById(booking.customerId);
        if (!user) return;

        // Get garage info
        const garage = await Garage.findById(booking.garageId);
        if (!garage) return;

        // Get services info
        const services = await Service.find({
            _id: { $in: booking.serviceIds },
        });
        if (!services || services.length === 0) return;

        // Format date
        const formattedDate = new Date(booking.date).toLocaleDateString(
            'en-US',
            {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            },
        );

        // Format time - now using the selectedTimeSlot directly
        const formattedTime = booking.selectedTimeSlot;

        // Format services list
        const servicesList = services.map((service) => ({
            name: service.name,
            price: service.price.toFixed(2),
            duration: service.duration,
        }));

        // Send email to customer
        await sendMail({
            to: user.email,
            subject: 'Your Booking Confirmation',
            type: 'bookingConfirmation',
            data: {
                name: user.name,
                bookingId: booking._id.toString(),
                garageName: garage.name,
                garageAddress: garage.address,
                garagePhone: garage.phone,
                date: formattedDate,
                time: formattedTime,
                services: servicesList,
                totalAmount: booking.totalAmount.toFixed(2),
                pickupDropService: booking.pickupDrop?.opted ? 'Yes' : 'No',
                pickupAddress: booking.pickupDrop?.opted
                    ? booking.pickupDrop?.pickupAddress
                    : 'N/A',
                dropAddress: booking.pickupDrop?.opted
                    ? booking.pickupDrop?.dropAddress
                    : 'N/A',
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}`,
            },
        });

        // Send notification to garage admin
        const garageAdmin = await User.findById(garage.ownerId);
        if (garageAdmin) {
            await sendMail({
                to: garageAdmin.email,
                subject: 'New Booking Notification',
                type: 'newBookingNotification',
                data: {
                    name: garageAdmin.name,
                    customerName: user.name,
                    customerEmail: user.email,
                    bookingId: booking._id.toString(),
                    date: formattedDate,
                    time: formattedTime,
                    services: servicesList,
                    totalAmount: booking.totalAmount.toFixed(2),
                    dashboardUrl: `${process.env.ADMIN_FRONTEND_URL}/bookings/${booking._id}`,
                },
            });
        } else {
            logger.error(`Garage admin not found for garage ${garage._id}`);
        }

        scheduleRemindersForBooking(booking);
    } catch (error) {
        logger.error('Error sending booking confirmation email:', error);
    }
};

// Send booking status update email
export const sendBookingStatusUpdateEmail = async (booking) => {
    try {
        const user = await User.findById(booking.customerId);
        if (!user) return;

        const garage = await Garage.findById(booking.garageId);
        if (!garage) return;

        const statusMessages = {
            [BOOKING_STATUS.CONFIRMED]: 'Your booking has been confirmed!',
            [BOOKING_STATUS.IN_PROGRESS]: 'Work on your vehicle has begun.',
            [BOOKING_STATUS.COMPLETED]: 'Your service has been completed!',
            [BOOKING_STATUS.CANCELLED]: 'Your booking has been cancelled.',
        };

        let emailSubject = `Booking Status Update: ${booking.status}`;
        let emailType = 'bookingStatusUpdate';

        // Special case for completion - use a different template
        if (booking.status === BOOKING_STATUS.COMPLETED) {
            emailType = 'serviceCompleted';
            emailSubject = 'Your Service is Complete - Leave a Review!';
        }

        await sendMail({
            to: user.email,
            subject: emailSubject,
            type: emailType,
            data: {
                name: user.name,
                bookingId: booking._id.toString(),
                garageName: garage.name,
                status: booking.status,
                statusMessage:
                    statusMessages[booking.status] ||
                    'Your booking status has been updated.',
                date: new Date(booking.date).toLocaleDateString(),
                notes: booking.notes || 'No additional notes.',
                reviewLink:
                    booking.status === BOOKING_STATUS.COMPLETED
                        ? `${process.env.FRONTEND_URL}/review/${booking._id}`
                        : null,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}`,
            },
        });
    } catch (error) {
        console.error('Error sending booking status update email:', error);
    }
};

// Send booking reminder
export const sendBookingReminderEmail = async (booking, reminderType) => {
    try {
        const user = await User.findById(booking.customerId);
        if (!user) return;

        const garage = await Garage.findById(booking.garageId);
        if (!garage) return;

        let reminderText = '';
        if (reminderType === '24hours') {
            reminderText = '24 hours';
        } else if (reminderType === '1hour') {
            reminderText = '1 hour';
        }

        // Format date
        const formattedDate = new Date(booking.date).toLocaleDateString(
            'en-US',
            {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            },
        );

        await sendMail({
            to: user.email,
            subject: `Reminder: Your Garage Appointment in ${reminderText}`,
            type: 'bookingReminder',
            data: {
                name: user.name,
                garageName: garage.name,
                reminderTime: reminderText,
                date: formattedDate,
                time: booking.selectedTimeSlot,
                address: garage.address,
                phone: garage.phone,
                pickupDropService: booking.pickupDrop?.opted ? 'Yes' : 'No',
                pickupAddress: booking.pickupDrop?.opted
                    ? booking.pickupDrop.pickupAddress
                    : 'N/A',
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}`,
                cancelUrl: `${process.env.FRONTEND_URL}/dashboard/bookings/${booking._id}/cancel`,
            },
        });

        // Update reminder status in booking
        if (reminderType === '24hours') {
            booking.reminderSent.twentyFourHour = true;
        } else if (reminderType === '1hour') {
            booking.reminderSent.oneHour = true;
        }
        await booking.save();
    } catch (error) {
        console.error(`Error sending ${reminderType} reminder email:`, error);
    }
};

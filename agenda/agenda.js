// // agenda/agenda.js
// import Agenda from 'agenda';
// import { sendMail } from '../mail/sendMail.js';
// import Booking from '../models/booking.model.js';
// import services from '../models/petService.model.js';
// import logger from '../helpers/logger.helper.js';

// const agenda = new Agenda({
//     db: {
//         address: process.env.MONGO_URI,
//         collection: 'bookingRemainders',
//         options: { useUnifiedTopology: true },
//     },
//     processEvery: '10 seconds', // Poll jobs every 10s (adjust if needed)
//     defaultLockLifetime: 2 * 60 * 1000, // 2 minutes lock time
// });

// agenda.on('ready', () => {
//     logger.info('Agenda connected and ready');
// });

// agenda.on('error', (err) => {
//     logger.error('Agenda error:', err);
// });

// export default agenda;

// export const defineReminderJobs = (agenda) => {
//     agenda.define('send 1-hour reminder', async (job) => {
//         try {
//             const { bookingId } = job.attrs.data;
//             const booking = await Booking.findById(bookingId);
//             if (!booking || booking?.reminderSent?.oneHour) return;

//             const serviceDetails = await services.findById(
//                 booking?.services?.[0],
//             );
//             await sendMail({
//                 to: booking?.customerDetails?.email,
//                 subject: 'Your booking is coming up in 1 hour',
//                 type: 'bookingReminder',
//                 data: {
//                     customerDetails: booking.customerDetails,
//                     serviceDetails: serviceDetails,
//                     date: booking.date,
//                     timeSlot: booking.timeSlot,
//                     petDetails: booking.petDetails,
//                     _id: booking._id,
//                 },
//             });

//             booking.reminderSent.oneHour = true;
//             await booking.save();
//             await job.remove();
//         } catch (err) {
//             logger.error('Error in 1-hour reminder job:', err);
//         }
//     });

//     agenda.define('send 24-hour reminder', async (job) => {
//         try {
//             const { bookingId } = job.attrs.data;
//             const booking = await Booking.findById(bookingId);
//             if (!booking || booking?.reminderSent?.twentyFourHour) return;

//             const serviceDetails = await services.findById(
//                 booking?.services?.[0],
//             );
//             await sendMail({
//                 to: booking?.customerDetails?.email,
//                 subject: 'Your booking is coming up in 24 hours',
//                 type: 'bookingReminder',
//                 data: {
//                     customerDetails: booking.customerDetails,
//                     serviceDetails: serviceDetails,
//                     date: booking.date,
//                     timeSlot: booking.timeSlot,
//                     petDetails: booking.petDetails,
//                     _id: booking._id,
//                 },
//             });

//             booking.reminderSent.twentyFourHour = true;
//             await booking.save();
//             await job.remove();

//             logger.info(`Sent 24-hour reminder for booking ${booking._id}`);
//         } catch (err) {
//             logger.error('Error in 24-hour reminder job:', err);
//         }
//     });
// };

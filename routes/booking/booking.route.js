import { Router } from 'express';
import {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus,
    updateBooking,
    deleteBooking,
    submitReview,
    getAnalytics,
} from '../../controllers/booking.controller.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PickupDrop:
 *       type: object
 *       properties:
 *         opted:
 *           type: boolean
 *           example: true
 *         pickupAddress:
 *           type: string
 *           example: "123 Main St, Apt 4B, New York, NY 10001"
 *         dropAddress:
 *           type: string
 *           example: "456 Park Ave, New York, NY 10022"
 *     BookingRequest:
 *       type: object
 *       required:
 *         - garageId
 *         - serviceIds
 *         - date
 *         - timeSlotId
 *       properties:
 *         garageId:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         serviceIds:
 *           type: array
 *           items:
 *             type: string
 *           example: ["60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c87"]
 *         date:
 *           type: string
 *           format: date
 *           example: "2023-07-15"
 *         timeSlotId:
 *           type: string
 *           example: "60d21b4667d0d8992e610c88"
 *         pickupDrop:
 *           $ref: '#/components/schemas/PickupDrop'
 *         customerId:
 *           type: string
 *           description: Required only when garage admin creates booking for a customer
 *           example: "60d21b4667d0d8992e610c89"
 *     BookingUpdateStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, in-progress, completed, cancelled]
 *           example: "confirmed"
 *         notes:
 *           type: string
 *           example: "Customer requested early completion"
 *     BookingUpdateRequest:
 *       type: object
 *       properties:
 *         serviceIds:
 *           type: array
 *           items:
 *             type: string
 *           example: ["60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c87"]
 *         date:
 *           type: string
 *           format: date
 *           example: "2023-07-16"
 *         timeSlotId:
 *           type: string
 *           example: "60d21b4667d0d8992e610c90"
 *         pickupDrop:
 *           $ref: '#/components/schemas/PickupDrop'
 *         notes:
 *           type: string
 *           example: "Customer requested additional services"
 *     BookingResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c91"
 *         customerId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "60d21b4667d0d8992e610c89"
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "johndoe@example.com"
 *         garageId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "60d21b4667d0d8992e610c85"
 *             name:
 *               type: string
 *               example: "Quick Fix Auto"
 *             address:
 *               type: string
 *               example: "123 Main Street, New York, NY 10001"
 *         serviceIds:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c86"
 *               name:
 *                 type: string
 *                 example: "Oil Change"
 *               price:
 *                 type: number
 *                 example: 49.99
 *               duration:
 *                 type: number
 *                 example: 30
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2023-07-15T00:00:00.000Z"
 *         timeSlot:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "60d21b4667d0d8992e610c88"
 *             day:
 *               type: string
 *               example: "Monday"
 *             startTime:
 *               type: string
 *               example: "10:00"
 *             endTime:
 *               type: string
 *               example: "11:00"
 *         pickupDrop:
 *           $ref: '#/components/schemas/PickupDrop'
 *         status:
 *           type: string
 *           example: "pending"
 *         totalAmount:
 *           type: number
 *           example: 99.98
 *         paymentStatus:
 *           type: string
 *           example: "pending"
 *         notes:
 *           type: string
 *           example: "Please check brakes as well"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-07-10T15:46:28.932Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-07-10T15:46:28.932Z"
 */

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Create a service booking at a garage
 *     tags:
 *       - Bookings
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: Get all bookings
 *     description: Retrieve a list of bookings with optional filtering
 *     tags:
 *       - Bookings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in-progress, completed, cancelled]
 *         description: Filter by status
 *         example: "confirmed"
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (start)
 *         example: "2023-07-01"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (end)
 *         example: "2023-07-31"
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [createdAt, date, status, totalAmount]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "date"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: integer
 *           enum: [-1, 1]
 *           default: -1
 *         description: Sort order (1 for ascending, -1 for descending)
 *         example: 1
 *     responses:
 *       200:
 *         description: List of bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bookings retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BookingResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     totalCount:
 *                       type: integer
 *                       example: 25
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     nextPage:
 *                       type: integer
 *                       example: 2
 *                     previousPage:
 *                       type: integer
 *                       example: null
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    authorize([USER_TYPES.USER, USER_TYPES.GARAGE_ADMIN]),
    createBooking,
);
router.get(
    '/',
    authorize([
        USER_TYPES.USER,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.SUPERADMIN,
    ]),
    getBookings,
);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     description: Retrieve details of a specific booking
 *     tags:
 *       - Bookings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *         example: "60d21b4667d0d8992e610c91"
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/BookingResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 *   patch:
 *     summary: Update booking status
 *     description: Update the status of a booking
 *     tags:
 *       - Bookings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *         example: "60d21b4667d0d8992e610c91"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingUpdateStatusRequest'
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update booking details
 *     description: Update the details of a booking (garage admin only)
 *     tags:
 *       - Bookings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *         example: "60d21b4667d0d8992e610c91"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingUpdateRequest'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete booking
 *     description: Delete a booking (admin only)
 *     tags:
 *       - Bookings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *         example: "60d21b4667d0d8992e610c91"
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get(
    '/:id',
    authorize([
        USER_TYPES.USER,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.SUPERADMIN,
    ]),
    getBookingById,
);
router.patch(
    '/:id/status',
    authorize([
        USER_TYPES.USER,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.SUPERADMIN,
    ]),
    updateBookingStatus,
);
router.put(
    '/:id',
    authorize([USER_TYPES.GARAGE_ADMIN, USER_TYPES.SUPERADMIN]),
    updateBooking,
);
router.delete(
    '/:id',
    authorize([USER_TYPES.GARAGE_ADMIN, USER_TYPES.SUPERADMIN]),
    deleteBooking,
);

// /**
//  * @swagger
//  * /bookings/{id}/payment:
//  *   post:
//  *     summary: Initiate payment for a booking
//  *     description: Create a payment intent for a booking
//  *     tags:
//  *       - Booking Payments
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Booking ID
//  *     responses:
//  *       200:
//  *         description: Payment intent created successfully
//  *       400:
//  *         description: Invalid request
//  *       404:
//  *         description: Booking not found
//  */
// router.post(
//     '/:bookingId/payment',
//     authorize([USER_TYPES.USER, USER_TYPES.GARAGE_ADMIN]),
//     initiatePayment,
// );

// /**
//  * @swagger
//  * /bookings/{id}/payment/complete:
//  *   post:
//  *     summary: Complete payment for a booking
//  *     description: Confirm payment and generate invoice
//  *     tags:
//  *       - Booking Payments
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Booking ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               paymentIntentId:
//  *                 type: string
//  *                 description: Stripe payment intent ID
//  *                 example: "pi_3NZQvdC78YOlxSo91Bvx2X4Y"
//  *     responses:
//  *       200:
//  *         description: Payment completed successfully
//  *       400:
//  *         description: Invalid request or payment failed
//  *       404:
//  *         description: Booking not found
//  */
// router.post(
//     '/:bookingId/payment/complete',
//     authorize([USER_TYPES.USER, USER_TYPES.GARAGE_ADMIN]),
//     completePayment,
// );

// /**
//  * @swagger
//  * /bookings/{id}/refund:
//  *   post:
//  *     summary: Process refund for a booking
//  *     description: Issue refund for a completed payment (admin only)
//  *     tags:
//  *       - Booking Payments
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Booking ID
//  *     responses:
//  *       200:
//  *         description: Refund processed successfully
//  *       400:
//  *         description: Invalid request or refund failed
//  *       403:
//  *         description: Forbidden - only admins can process refunds
//  *       404:
//  *         description: Booking not found
//  */
// router.post(
//     '/:bookingId/refund',
//     authorize([USER_TYPES.GARAGE_ADMIN, USER_TYPES.SUPERADMIN]),
//     requestRefund,
// );

/**
 * @swagger
 * /bookings/{id}/review:
 *   post:
 *     summary: Submit a review for a completed booking
 *     description: Allow customers to review their experience after service completion
 *     tags:
 *       - Booking Reviews
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *               - serviceQuality
 *               - valueForMoney
 *               - punctuality
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Great service, very professional and fast."
 *               serviceQuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               valueForMoney:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               punctuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *     responses:
 *       200:
 *         description: Review submitted successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Forbidden - only customers can submit reviews
 *       404:
 *         description: Booking not found
 */
router.post('/:bookingId/review', authorize([USER_TYPES.USER]), submitReview);

/**
 * @swagger
 * /bookings/analytics:
 *   get:
 *     summary: Get booking analytics
 *     description: Retrieve analytics data about bookings and performance
 *     tags:
 *       - Booking Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       403:
 *         description: Forbidden
 */
router.get(
    '/analytics',
    authorize([USER_TYPES.GARAGE_ADMIN, USER_TYPES.SUPERADMIN]),
    getAnalytics,
);

export default router;

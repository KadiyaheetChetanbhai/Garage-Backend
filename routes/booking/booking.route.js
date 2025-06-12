import { Router } from 'express';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';
import { createBooking, deleteBooking, getBookingById, getBookings, updateBooking, updateBookingStatus } from '../../controllers/booking.controller.js';


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
 *           description: Whether pickup/drop service is requested
 *           example: true
 *         pickupAddress:
 *           type: string
 *           description: Address for vehicle pickup
 *           example: 123 Customer Street, City, 12345
 *         dropAddress:
 *           type: string
 *           description: Address for vehicle drop-off
 *           example: 456 Customer Avenue, City, 12345
 *
 *     TimeSlot:
 *       type: object
 *       properties:
 *         day:
 *           type: string
 *           enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *           description: Day of the week
 *           example: Monday
 *         open:
 *           type: string
 *           description: Opening time (HH:MM in 24-hour format)
 *           example: "09:00"
 *         close:
 *           type: string
 *           description: Closing time (HH:MM in 24-hour format)
 *           example: "17:00"
 *         isClosed:
 *           type: boolean
 *           description: Whether the time slot is closed
 *           example: false
 *
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated booking ID
 *           example: 60d21b4667d0d8992e610c85
 *         customerId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d21b4667d0d8992e610c90
 *             name:
 *               type: string
 *               example: John Doe
 *             email:
 *               type: string
 *               example: john.doe@example.com
 *           description: Customer who made the booking
 *         garageId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d21b4667d0d8992e610c80
 *             name:
 *               type: string
 *               example: City Center Garage
 *             address:
 *               type: string
 *               example: 123 Main St, New York, NY 10001
 *           description: Garage where services will be performed
 *         serviceIds:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               name:
 *                 type: string
 *                 example: Full Engine Service
 *               price:
 *                 type: number
 *                 example: 149.99
 *               duration:
 *                 type: number
 *                 example: 120
 *           description: Services requested in this booking
 *         date:
 *           type: string
 *           format: date-time
 *           description: Scheduled date for the booking
 *           example: 2023-07-15T10:00:00.000Z
 *         timeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *           description: Time slots selected for this booking
 *         pickupDrop:
 *           $ref: '#/components/schemas/PickupDrop'
 *         transportPartnerId:
 *           type: string
 *           nullable: true
 *           description: ID of transport partner if pickup/drop service is used
 *           example: 60d21b4667d0d8992e610c95
 *         status:
 *           type: string
 *           enum: [pending, confirmed, in-progress, completed, cancelled]
 *           description: Current status of the booking
 *           example: confirmed
 *         totalAmount:
 *           type: number
 *           description: Total amount for all services
 *           example: 149.99
 *         paymentStatus:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *           description: Current payment status
 *           example: pending
 *         invoiceUrl:
 *           type: string
 *           nullable: true
 *           description: URL to invoice if available
 *           example: https://example.com/invoices/INV-2023-001.pdf
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Additional notes for the booking
 *           example: Customer reported unusual engine noise
 *         createdBy:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *               example: 60d21b4667d0d8992e610c90
 *             userType:
 *               type: string
 *               example: customer
 *           description: User who created the booking
 *         reminderSent:
 *           type: object
 *           properties:
 *             oneHour:
 *               type: boolean
 *               example: false
 *             twentyFourHour:
 *               type: boolean
 *               example: true
 *           description: Status of reminder notifications
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: 2023-06-20T14:30:15.123Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: 2023-06-21T09:45:30.987Z
 */

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags:
 *       - Bookings
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - garageId
 *               - serviceIds
 *               - date
 *               - totalAmount
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c90
 *               garageId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c80
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86"]
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-07-15T10:00:00.000Z
 *               timeSlots:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TimeSlot'
 *                 example:
 *                   - day: Monday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *               pickupDrop:
 *                 $ref: '#/components/schemas/PickupDrop'
 *               totalAmount:
 *                 type: number
 *                 example: 249.98
 *               notes:
 *                 type: string
 *                 example: Please check the brake fluid as well
 *           examples:
 *             basicBooking:
 *               summary: Basic Booking
 *               value:
 *                 customerId: 60d21b4667d0d8992e610c90
 *                 garageId: 60d21b4667d0d8992e610c80
 *                 serviceIds: ["60d21b4667d0d8992e610c85"]
 *                 date: 2023-07-15T10:00:00.000Z
 *                 totalAmount: 149.99
 *             fullBooking:
 *               summary: Booking with Pickup/Drop
 *               value:
 *                 customerId: 60d21b4667d0d8992e610c90
 *                 garageId: 60d21b4667d0d8992e610c80
 *                 serviceIds: ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86"]
 *                 date: 2023-07-15T10:00:00.000Z
 *                 timeSlots:
 *                   - day: Monday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                 pickupDrop:
 *                   opted: true
 *                   pickupAddress: 123 Customer Street, City, 12345
 *                   dropAddress: 456 Customer Avenue, City, 12345
 *                 totalAmount: 249.98
 *                 notes: Please check the brake fluid as well
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
 *                   example: Booking created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission
 *       404:
 *         description: Customer or Garage not found
 *       422:
 *         description: Validation error
 */
router.post(
    '/',
    authorize([
        USER_TYPES.SUPERADMIN,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.CUSTOMER,
    ]),
    createBooking,
);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings with filtering
 *     description: Admins see all bookings, garage owners see their garage's bookings, customers see only their bookings
 *     tags:
 *       - Bookings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, date, status, totalAmount]
 *           default: date
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in-progress, completed, cancelled, all]
 *         description: Filter by booking status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter bookings from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter bookings until this date (YYYY-MM-DD)
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID (admin and garage owners only)
 *       - in: query
 *         name: garageId
 *         schema:
 *           type: string
 *         description: Filter by garage ID (admin only)
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bookings retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrevious:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Bad request - invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/',
    authorize([
        USER_TYPES.SUPERADMIN,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.CUSTOMER,
    ]),
    getBookings,
);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking details by ID
 *     description: Admins can view any booking, garage owners can view their garage's bookings, customers can view only their bookings
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
 *                   example: Booking details retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid booking ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission to view this booking
 *       404:
 *         description: Booking not found
 */
router.get(
    '/:id',
    authorize([
        USER_TYPES.SUPERADMIN,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.CUSTOMER,
    ]),
    getBookingById,
);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     description: Admins can update any booking, garage owners can update their garage's bookings, customers have limited update capabilities
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86"]
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-07-20T14:00:00.000Z
 *               timeSlots:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TimeSlot'
 *               pickupDrop:
 *                 $ref: '#/components/schemas/PickupDrop'
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, in-progress, completed, cancelled]
 *                 example: confirmed
 *               totalAmount:
 *                 type: number
 *                 example: 299.99
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *                 example: pending
 *               notes:
 *                 type: string
 *                 example: Customer requested additional inspection
 *           examples:
 *             customerUpdate:
 *               summary: Customer Update (Limited Fields)
 *               value:
 *                 pickupDrop:
 *                   opted: true
 *                   pickupAddress: 789 New Address, City, 12345
 *                   dropAddress: 789 New Address, City, 12345
 *                 notes: I'll be 10 minutes late
 *             garageUpdate:
 *               summary: Garage Owner Update
 *               value:
 *                 status: confirmed
 *                 notes: Customer's vehicle has arrived
 *             adminUpdate:
 *               summary: Admin Full Update
 *               value:
 *                 serviceIds: ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c87"]
 *                 date: 2023-07-20T14:00:00.000Z
 *                 status: confirmed
 *                 totalAmount: 349.99
 *                 paymentStatus: completed
 *                 notes: Upgraded to premium service package
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
 *                   example: Booking updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission to update this booking
 *       404:
 *         description: Booking not found
 *       422:
 *         description: Validation error
 */
router.put(
    '/:id',
    authorize([
        USER_TYPES.SUPERADMIN,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.CUSTOMER,
    ]),
    updateBooking,
);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     description: Only admins and garage owners can delete bookings
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
 *                   example: Booking deleted successfully
 *       400:
 *         description: Bad request - booking cannot be deleted in current status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission to delete this booking
 *       404:
 *         description: Booking not found
 */
router.delete(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    deleteBooking,
);

/**
 * @swagger
 * /bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     description: Update only the status of a booking with proper validation of status transitions
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, in-progress, completed, cancelled]
 *                 example: confirmed
 *           examples:
 *             confirm:
 *               summary: Confirm Booking
 *               value:
 *                 status: confirmed
 *             cancel:
 *               summary: Cancel Booking
 *               value:
 *                 status: cancelled
 *             complete:
 *               summary: Complete Booking
 *               value:
 *                 status: completed
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
 *                   example: Booking status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request - invalid status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission to update this booking
 *       404:
 *         description: Booking not found
 */
router.patch(
    '/:id/status',
    authorize([
        USER_TYPES.SUPERADMIN,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.CUSTOMER,
    ]),
    updateBookingStatus,
);

export default router;

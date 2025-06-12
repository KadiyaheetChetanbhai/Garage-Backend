import { Router } from 'express';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';
import {
    createService,
    listServices,
    getServiceDetail,
    updateService,
    deleteService,
    getServicesByGarage,
} from '../../controllers/service/service.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
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
 *           description: Whether the service is unavailable on this day
 *           example: false
 *       required:
 *         - day
 *         - open
 *         - close
 *
 *     Service:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated service ID
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           description: Name of the service
 *           example: Full Engine Service
 *         description:
 *           type: string
 *           description: Detailed description of the service
 *           example: Complete engine check and maintenance including oil change, filter replacement, and diagnostics.
 *         price:
 *           type: number
 *           description: Price of the service
 *           example: 149.99
 *         duration:
 *           type: number
 *           description: Duration in minutes
 *           example: 120
 *         category:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d21b4667d0d8992e610c99
 *             name:
 *               type: string
 *               example: Engine Services
 *           description: Category the service belongs to
 *         image:
 *           type: string
 *           description: Image URL for the service
 *           example: https://example.com/images/engine-service.jpg
 *         isActive:
 *           type: boolean
 *           description: Whether the service is currently active
 *           example: true
 *         garage:
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
 *           description: Garage offering the service
 *         availableTimeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *           description: Time slots when this service is available
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
 *       required:
 *         - name
 *         - price
 *         - duration
 *         - category
 *         - garage
 */

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service
 *     tags:
 *       - Services
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - duration
 *               - category
 *               - garage
 *             properties:
 *               name:
 *                 type: string
 *                 example: Full Engine Service
 *               description:
 *                 type: string
 *                 example: Complete engine check and maintenance including oil change, filter replacement, and diagnostics.
 *               price:
 *                 type: number
 *                 example: 149.99
 *               duration:
 *                 type: number
 *                 example: 120
 *               category:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c99
 *               garage:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c80
 *               image:
 *                 type: string
 *                 example: https://example.com/images/engine-service.jpg
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               availableTimeSlots:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TimeSlot'
 *                 example:
 *                   - day: Monday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                   - day: Sunday
 *                     open: "10:00"
 *                     close: "15:00"
 *                     isClosed: true
 *           examples:
 *             basicService:
 *               summary: Basic Service
 *               value:
 *                 name: Basic Service
 *                 description: Quick service including oil change and basic inspection.
 *                 price: 49.99
 *                 duration: 60
 *                 category: 60d21b4667d0d8992e610c99
 *                 garage: 60d21b4667d0d8992e610c80
 *                 isActive: true
 *             fullService:
 *               summary: Full Service with Time Slots
 *               value:
 *                 name: Premium Full Service
 *                 description: Comprehensive vehicle service with advanced diagnostics and complete fluid change.
 *                 price: 199.99
 *                 duration: 180
 *                 category: 60d21b4667d0d8992e610c99
 *                 garage: 60d21b4667d0d8992e610c80
 *                 image: https://example.com/images/premium-service.jpg
 *                 isActive: true
 *                 availableTimeSlots:
 *                   - day: Monday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                   - day: Tuesday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                   - day: Wednesday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                   - day: Thursday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                   - day: Friday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                   - day: Saturday
 *                     open: "10:00"
 *                     close: "15:00"
 *                     isClosed: false
 *                   - day: Sunday
 *                     open: "00:00"
 *                     close: "00:00"
 *                     isClosed: true
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Service created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Bad request - invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission for this garage
 *       404:
 *         description: Category or Garage not found
 *       422:
 *         description: Validation error
 */
router.post(
    '/',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    createService,
);

/**
 * @swagger
 * /services:
 *   get:
 *     summary: List services with optional filtering
 *     tags:
 *       - Services
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
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search in name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: garage
 *         schema:
 *           type: string
 *         description: Filter by garage ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [name, price, duration, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *           default: -1
 *         description: Sort order (-1 for descending, 1 for ascending)
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Services retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     nextPage:
 *                       type: integer
 *                       nullable: true
 *                       example: 2
 *                     previousPage:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalCount:
 *                       type: integer
 *                       example: 42
 *       400:
 *         description: Bad request - invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/', listServices);

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Get service details by ID
 *     tags:
 *       - Services
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Service details retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Invalid service ID
 *       403:
 *         description: Forbidden - no permission to view this service
 *       404:
 *         description: Service not found
 */
router.get('/:id', getServiceDetail);

/**
 * @swagger
 * /services/garage/{garageId}:
 *   get:
 *     summary: Get all services for a specific garage
 *     tags:
 *       - Services
 *     parameters:
 *       - in: path
 *         name: garageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Garage ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Garage services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage services retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *       400:
 *         description: Invalid garage ID
 *       404:
 *         description: Garage not found
 *       500:
 *         description: Server error
 */
router.get('/garage/:garageId', getServicesByGarage);

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Update a service
 *     tags:
 *       - Services
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Engine Service
 *               description:
 *                 type: string
 *                 example: Updated service description with additional features
 *               price:
 *                 type: number
 *                 example: 159.99
 *               duration:
 *                 type: number
 *                 example: 150
 *               category:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c99
 *               image:
 *                 type: string
 *                 example: https://example.com/images/updated-service.jpg
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               availableTimeSlots:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TimeSlot'
 *           examples:
 *             priceUpdate:
 *               summary: Update Price Only
 *               value:
 *                 price: 159.99
 *             timeSlotUpdate:
 *               summary: Update Time Slots
 *               value:
 *                 availableTimeSlots:
 *                   - day: Monday
 *                     open: "08:00"
 *                     close: "18:00"
 *                     isClosed: false
 *                   - day: Tuesday
 *                     open: "08:00"
 *                     close: "18:00"
 *                     isClosed: false
 *                   - day: Sunday
 *                     open: "00:00"
 *                     close: "00:00"
 *                     isClosed: true
 *             fullUpdate:
 *               summary: Full Service Update
 *               value:
 *                 name: Premium Engine Service Plus
 *                 description: Enhanced engine service with extended warranty and additional checks
 *                 price: 179.99
 *                 duration: 150
 *                 category: 60d21b4667d0d8992e610c99
 *                 image: https://example.com/images/premium-plus.jpg
 *                 isActive: true
 *                 availableTimeSlots:
 *                   - day: Monday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                   - day: Wednesday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *                   - day: Friday
 *                     open: "09:00"
 *                     close: "17:00"
 *                     isClosed: false
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Service updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Bad request - invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission to update this service
 *       404:
 *         description: Service or Category not found
 *       422:
 *         description: Validation error
 */
router.put(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    updateService,
);

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete a service
 *     tags:
 *       - Services
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID to delete
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Service deleted successfully
 *       400:
 *         description: Invalid service ID or service has bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission to delete this service
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    deleteService,
);

export default router;

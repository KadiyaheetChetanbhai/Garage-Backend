import { Router } from 'express';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';
import {
    createTransport,
    listTransports,
    getTransportDetail,
    updateTransport,
    deleteTransport,
} from '../../controllers/transport/transport.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Transport:
 *       type: object
 *       properties:
 *         garageId:
 *           type: string
 *           description: ID of the garage this transport belongs to
 *         vehicleType:
 *           type: string
 *           enum: [car, van, truck, motorcycle, other]
 *           description: Type of vehicle
 *         vehicleName:
 *           type: string
 *           description: Model/name of the vehicle
 *         vehicleNumber:
 *           type: string
 *           description: License/registration number
 *         capacity:
 *           type: number
 *           description: Capacity of the vehicle
 *         driverName:
 *           type: string
 *           description: Name of the assigned driver
 *         driverContact:
 *           type: string
 *           description: Contact number of the driver
 *         isActive:
 *           type: boolean
 *           description: Whether the vehicle is currently active
 *         note:
 *           type: string
 *           description: Additional notes
 *       required:
 *         - garageId
 *         - vehicleType
 *         - vehicleName
 *         - vehicleNumber
 */

/**
 * @swagger
 * /transports:
 *   post:
 *     summary: Create a new transport vehicle
 *     tags:
 *       - Transport Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transport'
 *     responses:
 *       200:
 *         description: Transport vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transport vehicle created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Transport'
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post(
    '/',
    authorize([
        USER_TYPES.SUPERADMIN,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.GARAGE_ADMIN,
    ]),
    createTransport,
);

/**
 * @swagger
 * /transports:
 *   get:
 *     summary: Get a paginated list of transport vehicles
 *     tags:
 *       - Transport Management
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page (default is 10)
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Text to search in vehicle name, number or driver name
 *       - in: query
 *         name: garageId
 *         schema:
 *           type: string
 *         description: Filter by garage ID
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *           enum: [car, van, truck, motorcycle, other]
 *         description: Filter by vehicle type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [vehicleName, vehicleType, createdAt]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of transport vehicles retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', listTransports);

/**
 * @swagger
 * /transports/{id}:
 *   get:
 *     summary: Get transport vehicle details
 *     tags:
 *       - Transport Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the transport vehicle
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transport vehicle details retrieved successfully
 *       404:
 *         description: Transport vehicle not found
 *       422:
 *         description: Invalid ID format
 */
router.get('/:id', getTransportDetail);

/**
 * @swagger
 * /transports/{id}:
 *   put:
 *     summary: Update existing transport vehicle
 *     tags:
 *       - Transport Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Transport ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [car, van, truck, motorcycle, other]
 *               vehicleName:
 *                 type: string
 *               vehicleNumber:
 *                 type: string
 *               capacity:
 *                 type: number
 *               driverName:
 *                 type: string
 *               driverContact:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transport vehicle updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transport vehicle not found
 *       422:
 *         description: Invalid input
 */
router.put(
    '/:id',
    authorize([
        USER_TYPES.SUPERADMIN,
        USER_TYPES.GARAGE_ADMIN,
        USER_TYPES.GARAGE_ADMIN,
    ]),
    updateTransport,
);

/**
 * @swagger
 * /transports/{id}:
 *   delete:
 *     summary: Delete a transport vehicle
 *     tags:
 *       - Transport Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the transport vehicle to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transport vehicle deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transport vehicle not found
 *       422:
 *         description: Invalid ID format
 */
router.delete(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    deleteTransport,
);

export default router;

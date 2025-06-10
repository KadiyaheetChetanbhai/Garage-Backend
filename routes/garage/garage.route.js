import { Router } from 'express';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';
import {
    createGarage,
    listGarages,
    getGarageDetail,
    updateGarage,
    deleteGarage,
} from '../../controllers/garage/garage.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Garage:
 *       type: object
 *       properties:
 *         ownerId:
 *           type: string
 *           description: Reference to garage owner
 *         name:
 *           type: string
 *           description: Name of the garage
 *         address:
 *           type: string
 *           description: Physical address of the garage
 *         phone:
 *           type: string
 *           description: Contact number of the garage
 *         pincode:
 *           type: string
 *           description: Postal/ZIP code
 *         mapLink:
 *           type: string
 *           description: Google Maps or similar link
 *         latitude:
 *           type: number
 *           description: Geographical latitude coordinate
 *         longitude:
 *           type: number
 *           description: Geographical longitude coordinate
 *         website:
 *           type: string
 *           description: Garage website URL
 *         description:
 *           type: string
 *           description: Detailed description of the garage
 *         rating:
 *           type: number
 *           description: Average customer rating
 *         priceRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               description: Minimum price for services
 *             max:
 *               type: number
 *               description: Maximum price for services
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         pickupDropAvailable:
 *           type: boolean
 *           description: Whether pickup and drop service is available
 *         timeSlots:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 description: Day of week
 *               open:
 *                 type: string
 *                 description: Opening time
 *               close:
 *                 type: string
 *                 description: Closing time
 *               isClosed:
 *                 type: boolean
 *                 description: Whether closed on this day
 *       required:
 *         - ownerId
 *         - name
 *         - address
 *         - phone
 */

/**
 * @swagger
 * /garages:
 *   post:
 *     summary: Create a new garage
 *     tags:
 *       - Garage Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Garage'
 *     responses:
 *       200:
 *         description: Garage created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Garage'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       422:
 *         description: Validation error
 */
router.post(
    '/',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.ADMIN]),
    createGarage,
);

/**
 * @swagger
 * /garages:
 *   get:
 *     summary: Get a paginated list of garages
 *     tags:
 *       - Garage Management
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
 *         description: Text to search in name, address or description
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [name, createdAt, rating]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of garages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garages retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       rating:
 *                         type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     nextPage:
 *                       type: integer
 *                     previousPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/', listGarages);

/**
 * @swagger
 * /garages/{id}:
 *   get:
 *     summary: Get garage details
 *     tags:
 *       - Garage Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the garage
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Garage details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage details retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Garage'
 *       404:
 *         description: Garage not found
 *       422:
 *         description: Invalid ID format
 */
router.get('/:id', getGarageDetail);

/**
 * @swagger
 * /garages/{id}:
 *   put:
 *     summary: Update existing garage
 *     tags:
 *       - Garage Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Garage ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Garage updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Garage'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Garage not found
 *       422:
 *         description: Invalid input
 */
router.put(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.ADMIN]),
    updateGarage,
);

/**
 * @swagger
 * /garages/{id}:
 *   delete:
 *     summary: Delete a garage
 *     tags:
 *       - Garage Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the garage to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Garage deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Garage not found
 *       422:
 *         description: Invalid ID format
 */
router.delete(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.ADMIN]),
    deleteGarage,
);

export default router;

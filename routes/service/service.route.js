import { Router } from 'express';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';
import {
    createService,
    listServices,
    getServiceDetail,
    updateService,
    deleteService,
} from '../../controllers/service/service.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the service
 *         description:
 *           type: string
 *           description: Detailed description of the service
 *         price:
 *           type: number
 *           description: Price of the service
 *         duration:
 *           type: number
 *           description: Duration in minutes
 *         category:
 *           type: string
 *           enum: [repair, maintenance, inspection, customization, other]
 *           description: Category of the service
 *         image:
 *           type: string
 *           description: Image URL for the service
 *         isActive:
 *           type: boolean
 *           description: Whether the service is currently active
 *       required:
 *         - name
 *         - price
 *         - duration
 *         - category
 */

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service
 *     tags:
 *       - Service Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
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
 *       401:
 *         description: Unauthorized
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
 *     summary: Get a paginated list of services
 *     tags:
 *       - Service Management
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
 *         description: Text to search in name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [repair, maintenance, inspection, customization, other]
 *         description: Filter by category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, category]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of services retrieved successfully
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
router.get('/', listServices);

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Get service details
 *     tags:
 *       - Service Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the service
 *         schema:
 *           type: string
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
 *       404:
 *         description: Service not found
 *       422:
 *         description: Invalid ID format
 */
router.get('/:id', getServiceDetail);

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Update existing service
 *     tags:
 *       - Service Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [repair, maintenance, inspection, customization, other]
 *               image:
 *                 type: string
 *               isActive:
 *                 type: boolean
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       422:
 *         description: Invalid input
 */
router.put(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.ADMIN]),
    updateService,
);

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete a service
 *     tags:
 *       - Service Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the service to delete
 *         schema:
 *           type: string
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *       422:
 *         description: Invalid ID format
 */
router.delete(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.ADMIN]),
    deleteService,
);

export default router;

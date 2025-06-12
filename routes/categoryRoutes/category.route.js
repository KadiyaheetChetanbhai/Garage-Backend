import { Router } from 'express';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from '../../controllers/category.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *           example: 60d21b4667d0d8992e610c99
 *         name:
 *           type: string
 *           description: Name of the category
 *           example: Engine Services
 *         description:
 *           type: string
 *           description: Detailed description of the category
 *           example: Services related to engine maintenance and repair
 *         icon:
 *           type: string
 *           description: Icon identifier or class
 *           example: fa-wrench
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           example: true
 *         displayOrder:
 *           type: integer
 *           description: Order for display purposes
 *           example: 1
 *         featuredImage:
 *           type: string
 *           description: URL to featured image
 *           example: /images/categories/engine.jpg
 *         metaTitle:
 *           type: string
 *           description: SEO title
 *           example: Engine Services and Repairs
 *         metaDescription:
 *           type: string
 *           description: SEO description
 *           example: Professional engine maintenance and repair services
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2023-06-20T12:30:45.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2023-06-20T12:30:45.000Z
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags:
 *       - Categories
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engine Services
 *               description:
 *                 type: string
 *                 example: Services related to engine maintenance and repair
 *               icon:
 *                 type: string
 *                 example: fa-wrench
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               displayOrder:
 *                 type: integer
 *                 example: 1
 *               featuredImage:
 *                 type: string
 *                 example: /images/categories/engine.jpg
 *               metaTitle:
 *                 type: string
 *                 example: Engine Services and Repairs
 *               metaDescription:
 *                 type: string
 *                 example: Professional engine maintenance and repair services
 *           examples:
 *             basic:
 *               summary: Basic Category
 *               value:
 *                 name: Tire Services
 *                 description: All tire-related services including replacement and rotation
 *                 isActive: true
 *             full:
 *               summary: Complete Category
 *               value:
 *                 name: Brake Services
 *                 description: Complete brake system services including pad replacement and fluid change
 *                 icon: fa-brake-warning
 *                 isActive: true
 *                 displayOrder: 2
 *                 featuredImage: /images/categories/brakes.jpg
 *                 metaTitle: Professional Brake Services
 *                 metaDescription: Expert brake repair and maintenance services
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Category created successfully
 *               data:
 *                 _id: 60d21b4667d0d8992e610c99
 *                 name: Engine Services
 *                 description: Services related to engine maintenance and repair
 *                 icon: fa-wrench
 *                 isActive: true
 *                 displayOrder: 1
 *                 featuredImage: /images/categories/engine.jpg
 *                 metaTitle: Engine Services and Repairs
 *                 metaDescription: Professional engine maintenance and repair services
 *                 createdAt: 2023-06-20T12:30:45.000Z
 *                 updatedAt: 2023-06-20T12:30:45.000Z
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict - Category with this name already exists
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: Failed to create category
 *               error: "\"name\" is required"
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    createCategory,
);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories with optional filtering
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, description, or meta fields
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: displayOrder
 *         description: Field to sort by (e.g., name, displayOrder, createdAt)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
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
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Categories retrieved successfully
 *               data:
 *                 - _id: 60d21b4667d0d8992e610c99
 *                   name: Engine Services
 *                   description: Services related to engine maintenance and repair
 *                   icon: fa-wrench
 *                   isActive: true
 *                   displayOrder: 1
 *                 - _id: 60d21b4667d0d8992e610c98
 *                   name: Brake Services
 *                   description: Complete brake system services
 *                   icon: fa-brake-warning
 *                   isActive: true
 *                   displayOrder: 2
 *               pagination:
 *                 total: 10
 *                 page: 1
 *                 limit: 10
 *                 pages: 1
 *       500:
 *         description: Server error
 */
router.get('/', getCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Category retrieved successfully
 *               data:
 *                 _id: 60d21b4667d0d8992e610c99
 *                 name: Engine Services
 *                 description: Services related to engine maintenance and repair
 *                 icon: fa-wrench
 *                 isActive: true
 *                 displayOrder: 1
 *                 featuredImage: /images/categories/engine.jpg
 *                 metaTitle: Engine Services and Repairs
 *                 metaDescription: Professional engine maintenance and repair services
 *                 createdAt: 2023-06-20T12:30:45.000Z
 *                 updatedAt: 2023-06-20T12:30:45.000Z
 *       400:
 *         description: Invalid category ID
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getCategoryById);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Engine Services
 *               description:
 *                 type: string
 *                 example: Updated description for engine services
 *               icon:
 *                 type: string
 *                 example: fa-tools
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               displayOrder:
 *                 type: integer
 *                 example: 3
 *               featuredImage:
 *                 type: string
 *                 example: /images/categories/updated-engine.jpg
 *               metaTitle:
 *                 type: string
 *                 example: Updated Engine Services and Repairs
 *               metaDescription:
 *                 type: string
 *                 example: Updated professional engine maintenance and repair services
 *           examples:
 *             nameUpdate:
 *               summary: Update Name Only
 *               value:
 *                 name: Performance Engine Services
 *             statusUpdate:
 *               summary: Update Status Only
 *               value:
 *                 isActive: false
 *             fullUpdate:
 *               summary: Complete Update
 *               value:
 *                 name: Premium Engine Services
 *                 description: High-quality engine services with warranty
 *                 icon: fa-engine
 *                 displayOrder: 1
 *                 isActive: true
 *                 featuredImage: /images/categories/premium-engine.jpg
 *                 metaTitle: Premium Engine Maintenance
 *                 metaDescription: Top-quality engine services and repairs
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Category updated successfully
 *               data:
 *                 _id: 60d21b4667d0d8992e610c99
 *                 name: Updated Engine Services
 *                 description: Updated description for engine services
 *                 icon: fa-tools
 *                 isActive: true
 *                 displayOrder: 3
 *                 featuredImage: /images/categories/updated-engine.jpg
 *                 metaTitle: Updated Engine Services and Repairs
 *                 metaDescription: Updated professional engine maintenance and repair services
 *                 createdAt: 2023-06-20T12:30:45.000Z
 *                 updatedAt: 2023-06-21T15:42:18.000Z
 *       400:
 *         description: Invalid category ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       409:
 *         description: A category with this name already exists
 *       422:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.put(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    updateCategory,
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Category deleted successfully
 *       400:
 *         description: Invalid category ID or category is in use by services
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    deleteCategory,
);

export default router;

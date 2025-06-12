import { Router } from 'express';
import { createUser } from '../controllers/user/userManagement.controller.js';
import { createGarageAdmin } from '../controllers/garageAdmin/garageAdminManagement.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: John Smith
 *         email:
 *           type: string
 *           format: email
 *           example: john.smith@example.com
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           example: John Smith
 *         email:
 *           type: string
 *           example: john.smith@example.com
 *         userType:
 *           type: string
 *           example: user
 *         isEditable:
 *           type: boolean
 *           example: true
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
 * /register/user:
 *   post:
 *     summary: Create a new user
 *     description: Register a new standard user
 *     tags:
 *       - Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       422:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/user', createUser);

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateGarageAdminRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           example: Mike Johnson
 *         email:
 *           type: string
 *           format: email
 *           example: mike.johnson@example.com
 *     GarageAdminResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d21b4667d0d8992e610c86
 *         name:
 *           type: string
 *           example: Mike Johnson
 *         email:
 *           type: string
 *           example: mike.johnson@example.com
 *         userType:
 *           type: string
 *           example: garage-admin
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2023-06-20T12:30:45.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2023-06-20T12:30:45.000Z
 *         garage:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 60d21b4667d0d8992e610c87
 *             name:
 *               type: string
 *               example: Quick Fix Auto
 */

/**
 * @swagger
 * /register/garage-admin:
 *   post:
 *     summary: Create a new garage admin
 *     description: Register a new garage admin with basic garage information
 *     tags:
 *       - Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGarageAdminRequest'
 *     responses:
 *       201:
 *         description: Garage admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage admin created successfully
 *                 data:
 *                   $ref: '#/components/schemas/GarageAdminResponse'
 *       422:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/garage-admin', createGarageAdmin);

export default router;

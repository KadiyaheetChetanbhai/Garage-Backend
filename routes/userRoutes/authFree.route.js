import { Router } from 'express';
import { createUser } from '../../controllers/user/userManagement.controller.js';

const router = Router();

/**
 * @swagger
 * /user-registration:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - User Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: New User
 *               email:
 *                 type: string
 *                 example: user@example.com
 *             required:
 *               - name
 *               - email
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *       409:
 *         description: Email already exists
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', createUser);

export default router;

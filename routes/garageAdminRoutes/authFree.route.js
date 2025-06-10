import { Router } from 'express';
import { createGarageAdmin } from '../../controllers/garageAdmin/garageAdminManagement.controller.js';

const router = Router();

/**
 * @swagger
 * /garage-admin-registration:
 *   post:
 *     summary: Register a new garage admin
 *     tags:
 *       - Garage Admin Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: New Garage Admin
 *               email:
 *                 type: string
 *                 example: garage@example.com
 *             required:
 *               - name
 *               - email
 *     responses:
 *       200:
 *         description: Garage Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: GarageAdmin created successfully
 *       409:
 *         description: Email already exists
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', createGarageAdmin);

export default router;

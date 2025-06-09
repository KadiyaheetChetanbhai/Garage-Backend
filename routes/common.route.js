import { Router } from 'express';
import { getProfile } from '../controllers/common.controller.js';
import { USER_TYPES } from '../constants/common.constant.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

/**
 * @swagger
 * /admin/profile:
 *   get:
 *     tags:
 *       - Admin Common
 *     summary: Get User Profile
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Admin
 *                       email:
 *                         type: string
 *                         example: admin@yopmail.com
 *                       userType:
 *                         type: string
 *                         example: Admin
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: Admin Management
 *                             module:
 *                               type: string
 *                               example: adminManagement
 *                             events:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example:
 *                                 - "List"
 *                                 - "View"
 *                                 - "Create"
 *
 *       500:
 *         description: Internal server error
 */
router.get('/admin/profile', authorize([USER_TYPES.ADMIN]), getProfile);

export default router;

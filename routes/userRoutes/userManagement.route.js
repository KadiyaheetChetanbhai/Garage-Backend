import { Router } from 'express';
import {
    deleteUser,
    updateUser,
    getUserDetail,
    listUsers,
} from '../../controllers/user/userManagement.controller.js';

const router = Router();

/**
 * @swagger
 * /user/list:
 *   get:
 *     summary: Get a paginated list of users
 *     tags:
 *       - User Management
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
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
router.get('/list', listUsers);

/**
 * @swagger
 * /user/detail/{id}:
 *   get:
 *     summary: Get user details
 *     tags:
 *       - User Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 */
router.get('/detail/:id', getUserDetail);

/**
 * @swagger
 * /user/update/{id}:
 *   put:
 *     summary: Update Existing User
 *     tags:
 *       - User Management
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/update/:id', updateUser);

/**
 * @swagger
 * /user/delete/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags:
 *       - User Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/delete/:id', deleteUser);

export default router;

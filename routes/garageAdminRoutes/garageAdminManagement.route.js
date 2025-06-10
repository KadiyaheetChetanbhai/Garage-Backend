import { Router } from 'express';

import {
    getGarageAdminDetail,
    updateGarageAdmin,
    deleteGarageAdmin,
    listGarageAdmin,
} from '../../controllers/garageAdmin/garageAdminManagement.controller.js';
import { hasPermission } from '../../middlewares/hasPermission.middleware.js';
import {
    MODULES,
    PERMISSION_EVENTS,
} from '../../constants/permission.constant.js';
import { getAllPermissions } from '../../controllers/admin/adminManagement.controller.js';

const router = Router();

/**
 * @swagger
 * /admin/permissions:
 *   get:
 *     tags:
 *       - Admin Management
 *     summary: List All Permissions
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Permissions retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Admin Management
 *                       module:
 *                         type: string
 *                         example: adminManagement
 *                       events:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             permissionId:
 *                               type: string
 *                               example: 67fcb31707a7b0302eb8b889
 *                             event:
 *                               type: string
 *                               example: List
 *       500:
 *         description: Internal server error
 */
router.get('/permissions', getAllPermissions);

/**
 * @swagger
 * /admin/list:
 *   get:
 *     summary: Get a paginated list of admins
 *     tags:
 *       - Admin Management
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
 *         description: Text to search in name or email
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of admins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin list retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       isEditable:
 *                         type: boolean
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
 *                     sortOrder:
 *                       type: string
 *                     sortBy:
 *                       type: string
 *                     searchTerm:
 *                       type: string
 *       403:
 *         description: Forbidden
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/list',
    hasPermission(MODULES.adminManagement, PERMISSION_EVENTS.LIST),
    listGarageAdmin,
);

/**
 * @swagger
 * /admin/detail/{id}:
 *   get:
 *     summary: Get admin details
 *     tags:
 *       - Admin Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the admin
 *         schema:
 *           type: string
 *           example: 651aa63ff5e9d8593a4f9852
 *     responses:
 *       200:
 *         description: Admin details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     userType:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           event:
 *                             type: string
 *                           module:
 *                             type: string
 *                           name:
 *                             type: string
 *       404:
 *         description: Admin not found
 *       422:
 *         description: Invalid ID format
 */
router.get(
    '/detail/:id',
    hasPermission(MODULES.adminManagement, PERMISSION_EVENTS.VIEW),
    getGarageAdminDetail,
);

/**
 * @swagger
 * /admin/update-admin/{id}:
 *   put:
 *     summary: Update Existing Admin
 *     tags:
 *       - Admin Management
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Admin ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Admin Name
 *               email:
 *                 type: string
 *                 example: updatedadmin@yopmail.com
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "67fcb31707a7b0302eb8b889"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin updated successfully
 *       404:
 *         description: Admin not found
 *       422:
 *         description: Invalid input or permissions not found
 */
router.put(
    '/update-admin/:id',
    hasPermission(MODULES.adminManagement, PERMISSION_EVENTS.EDIT),
    updateGarageAdmin,
);

/**
 * @swagger
 * /admin/delete-admin/{id}:
 *   delete:
 *     summary: Delete an admin
 *     tags:
 *       - Admin Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the admin to delete
 *         schema:
 *           type: string
 *           example: 651aa63ff5e9d8593a4f9852
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin deleted successfully
 *       404:
 *         description: Admin not found
 *       422:
 *         description: Invalid ID format
 */
router.delete(
    '/delete-admin/:id',
    hasPermission(MODULES.adminManagement, PERMISSION_EVENTS.DELETE),
    deleteGarageAdmin,
);

/**
 * @swagger
 * /garage-admin/list:
 *   get:
 *     summary: Get a paginated list of garage admins
 *     tags:
 *       - Garage Admin Management
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
 *         description: Text to search in name, email or garage name
 *     responses:
 *       200:
 *         description: List of garage admins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage Admin list retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       garageName:
 *                         type: string
 *                       address:
 *                         type: string
 *                       contactNumber:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 */

/**
 * @swagger
 * /garage-admin/detail/{id}:
 *   get:
 *     summary: Get garage admin details
 *     tags:
 *       - Garage Admin Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the garage admin
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Garage admin details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     garageName:
 *                       type: string
 *                     address:
 *                       type: string
 *                     contactNumber:
 *                       type: string
 *                     status:
 *                       type: string
 */

/**
 * @swagger
 * /garage-admin/update/{id}:
 *   put:
 *     summary: Update Existing Garage Admin
 *     tags:
 *       - Garage Admin Management
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Garage Admin ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Garage Admin Name
 *               email:
 *                 type: string
 *                 example: updatedgarageadmin@yopmail.com
 *               garageName:
 *                 type: string
 *                 example: Updated Star Garage
 *               address:
 *                 type: string
 *                 example: 456 New St, City
 *               contactNumber:
 *                 type: string
 *                 example: "+9876543210"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 */
router.put('/update/:id', updateGarageAdmin);

/**
 * @swagger
 * /garage-admin/delete/{id}:
 *   delete:
 *     summary: Delete a garage admin
 *     tags:
 *       - Garage Admin Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the garage admin to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Garage admin deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage admin deleted successfully
 *       404:
 *         description: Garage admin not found
 *       422:
 *         description: Invalid ID format
 */
router.delete('/delete/:id', deleteGarageAdmin);

export default router;

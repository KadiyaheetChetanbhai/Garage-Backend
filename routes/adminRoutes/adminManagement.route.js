import { Router } from 'express';
import {
    createAdmin,
    deleteAdmin,
    getAdminDetail,
    getAllPermissions,
    listAdmins,
    updateAdmin,
} from '../../controllers/admin/adminManagement.controller.js';
import { hasPermission } from '../../middlewares/hasPermission.middleware.js';
import {
    MODULES,
    PERMISSION_EVENTS,
} from '../../constants/permission.constant.js';

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
 * /admin/create-admin:
 *   post:
 *     summary: Create New Admin
 *     tags:
 *       - Admin Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: New Admin
 *               email:
 *                 type: string
 *                 example: newadmin@yopmail.com
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "67fcb31707a7b0302eb8b889"
 *             required:
 *               - name
 *               - email
 *               - permissions
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin created successfully
 *       422:
 *         description: Unprocessable entity
 */
router.post(
    '/create-admin',
    hasPermission(MODULES.adminManagement, PERMISSION_EVENTS.CREATE),
    createAdmin,
);

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
    listAdmins,
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
    getAdminDetail,
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
    '/update-superAdmin/:id',
    hasPermission(MODULES.adminManagement, PERMISSION_EVENTS.EDIT),
    updateAdmin,
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
    '/delete-superAdmin/:id',
    hasPermission(MODULES.adminManagement, PERMISSION_EVENTS.DELETE),
    deleteAdmin,
);

export default router;

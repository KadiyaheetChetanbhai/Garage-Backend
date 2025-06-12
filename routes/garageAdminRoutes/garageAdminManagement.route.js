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
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "67fcb31707a7b0302eb8b889"
 *         name:
 *           type: string
 *           example: "Admin Management"
 *         module:
 *           type: string
 *           example: "adminManagement"
 *         event:
 *           type: string
 *           example: "LIST"
 *     Admin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "651aa63ff5e9d8593a4f9852"
 *         name:
 *           type: string
 *           example: "John Admin"
 *         email:
 *           type: string
 *           example: "johnadmin@yopmail.com"
 *         userType:
 *           type: string
 *           example: "superadmin"
 *         isEditable:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-02T10:15:27.859Z"
 *         permissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *     GarageAdmin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "651aa63ff5e9d8593a4f9853"
 *         name:
 *           type: string
 *           example: "Robert Garcia"
 *         email:
 *           type: string
 *           example: "robert.garage@example.com"
 *         userType:
 *           type: string
 *           example: "garage-admin"
 *         garageName:
 *           type: string
 *           example: "Quick Fix Auto"
 *         address:
 *           type: string
 *           example: "123 Main Street, New York, NY 10001"
 *         contactNumber:
 *           type: string
 *           example: "212-555-1234"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         isEditable:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-10-02T10:15:27.859Z"
 */

/**
 * @swagger
 * /admin/permissions:
 *   get:
 *     tags:
 *       - Admin Management
 *     summary: List All Available Permissions
 *     description: Retrieves a list of all available permissions grouped by module
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Permissions retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Admin Management"
 *                       module:
 *                         type: string
 *                         example: "adminManagement"
 *                       events:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             permissionId:
 *                               type: string
 *                               example: "67fcb31707a7b0302eb8b889"
 *                             event:
 *                               type: string
 *                               example: "LIST"
 *             examples:
 *               permissionsExample:
 *                 value:
 *                   message: "Permissions retrieved successfully"
 *                   data:
 *                     - name: "Admin Management"
 *                       module: "adminManagement"
 *                       events:
 *                         - permissionId: "67fcb31707a7b0302eb8b889"
 *                           event: "LIST"
 *                         - permissionId: "67fcb31707a7b0302eb8b890"
 *                           event: "VIEW"
 *                         - permissionId: "67fcb31707a7b0302eb8b891"
 *                           event: "EDIT"
 *                         - permissionId: "67fcb31707a7b0302eb8b892"
 *                           event: "DELETE"
 *                     - name: "Garage Management"
 *                       module: "garageManagement"
 *                       events:
 *                         - permissionId: "67fcb31707a7b0302eb8b893"
 *                           event: "LIST"
 *                         - permissionId: "67fcb31707a7b0302eb8b894"
 *                           event: "VIEW"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/permissions', getAllPermissions);

/**
 * @swagger
 * /admin/list:
 *   get:
 *     summary: Get a paginated list of admins
 *     description: Retrieves a paginated list of admins with filtering and sorting options
 *     tags:
 *       - Admin Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Text to search in name or email
 *         example: "john"
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "name"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *           default: -1
 *         description: Sort order (1 for ascending, -1 for descending)
 *         example: "-1"
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
 *                   example: "Admin list retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     nextPage:
 *                       type: integer
 *                       example: 2
 *                     previousPage:
 *                       type: integer
 *                       example: null
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalCount:
 *                       type: integer
 *                       example: 25
 *                     sortOrder:
 *                       type: string
 *                       example: "-1"
 *                     sortBy:
 *                       type: string
 *                       example: "name"
 *                     searchTerm:
 *                       type: string
 *                       example: "john"
 *             examples:
 *               adminsListExample:
 *                 value:
 *                   message: "Admin list retrieved successfully"
 *                   data:
 *                     - _id: "651aa63ff5e9d8593a4f9852"
 *                       name: "John Admin"
 *                       email: "johnadmin@yopmail.com"
 *                       userType: "superadmin"
 *                       isEditable: true
 *                       createdAt: "2023-10-02T10:15:27.859Z"
 *                     - _id: "651aa63ff5e9d8593a4f9853"
 *                       name: "Jane Admin"
 *                       email: "janeadmin@yopmail.com"
 *                       userType: "superadmin"
 *                       isEditable: true
 *                       createdAt: "2023-10-02T09:18:22.459Z"
 *                   pagination:
 *                     page: 1
 *                     nextPage: 2
 *                     previousPage: null
 *                     totalPages: 3
 *                     pageSize: 10
 *                     totalCount: 25
 *                     sortOrder: "-1"
 *                     sortBy: "name"
 *                     searchTerm: "john"
 *       403:
 *         description: Forbidden - You don't have permission to access this resource
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 *     description: Retrieves detailed information about a specific admin including permissions
 *     tags:
 *       - Admin Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the admin
 *         schema:
 *           type: string
 *           example: "651aa63ff5e9d8593a4f9852"
 *     responses:
 *       200:
 *         description: Admin details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin details retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *             examples:
 *               adminDetailExample:
 *                 value:
 *                   message: "Admin details retrieved successfully"
 *                   data:
 *                     _id: "651aa63ff5e9d8593a4f9852"
 *                     name: "John Admin"
 *                     email: "johnadmin@yopmail.com"
 *                     userType: "superadmin"
 *                     isEditable: true
 *                     createdAt: "2023-10-02T10:15:27.859Z"
 *                     permissions:
 *                       - _id: "67fcb31707a7b0302eb8b889"
 *                         name: "Admin Management"
 *                         module: "adminManagement"
 *                         event: "LIST"
 *                       - _id: "67fcb31707a7b0302eb8b890"
 *                         name: "Admin Management"
 *                         module: "adminManagement"
 *                         event: "VIEW"
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin not found"
 *       422:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ID format"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - You don't have permission to access this resource
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
 *     description: Updates the details and permissions of an existing admin
 *     tags:
 *       - Admin Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: "651aa63ff5e9d8593a4f9852"
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
 *                 example: "Updated Admin Name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "updatedadmin@yopmail.com"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission IDs
 *                 example: ["67fcb31707a7b0302eb8b889", "67fcb31707a7b0302eb8b890"]
 *           examples:
 *             updateAdminExample:
 *               value:
 *                 name: "Updated Admin Name"
 *                 email: "updatedadmin@yopmail.com"
 *                 permissions: ["67fcb31707a7b0302eb8b889", "67fcb31707a7b0302eb8b890"]
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *             examples:
 *               updateAdminResponseExample:
 *                 value:
 *                   message: "Admin updated successfully"
 *                   data:
 *                     _id: "651aa63ff5e9d8593a4f9852"
 *                     name: "Updated Admin Name"
 *                     email: "updatedadmin@yopmail.com"
 *                     userType: "superadmin"
 *                     isEditable: true
 *                     permissions: ["67fcb31707a7b0302eb8b889", "67fcb31707a7b0302eb8b890"]
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin not found"
 *       422:
 *         description: Invalid input or permissions not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid input data or permissions not found"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - You don't have permission to access this resource
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
 *     description: Permanently removes an admin from the system
 *     tags:
 *       - Admin Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the admin to delete
 *         schema:
 *           type: string
 *           example: "651aa63ff5e9d8593a4f9852"
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
 *                   example: "Admin deleted successfully"
 *             examples:
 *               deleteAdminResponseExample:
 *                 value:
 *                   message: "Admin deleted successfully"
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin not found"
 *       422:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ID format"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - You don't have permission to access this resource
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
 *     description: Retrieves a paginated list of garage admins with search functionality
 *     tags:
 *       - Garage Admin Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Text to search in name, email or garage name
 *         example: "quick fix"
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [name, email, garageName, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "garageName"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *           default: -1
 *         description: Sort order (1 for ascending, -1 for descending)
 *         example: "1"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by account status
 *         example: "active"
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
 *                   example: "Garage Admin list retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GarageAdmin'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     nextPage:
 *                       type: integer
 *                       example: 2
 *                     previousPage:
 *                       type: integer
 *                       example: null
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalCount:
 *                       type: integer
 *                       example: 25
 *             examples:
 *               garageAdminsListExample:
 *                 value:
 *                   message: "Garage Admin list retrieved successfully"
 *                   data:
 *                     - _id: "651aa63ff5e9d8593a4f9853"
 *                       name: "Robert Garcia"
 *                       email: "robert.garage@example.com"
 *                       userType: "garage-admin"
 *                       garageName: "Quick Fix Auto"
 *                       address: "123 Main Street, New York, NY 10001"
 *                       contactNumber: "212-555-1234"
 *                       status: "active"
 *                       createdAt: "2023-10-02T10:15:27.859Z"
 *                     - _id: "651aa63ff5e9d8593a4f9854"
 *                       name: "Sarah Johnson"
 *                       email: "sarah.garage@example.com"
 *                       userType: "garage-admin"
 *                       garageName: "Premium Auto Service"
 *                       address: "456 Oak Avenue, Los Angeles, CA 90001"
 *                       contactNumber: "323-555-6789"
 *                       status: "active"
 *                       createdAt: "2023-10-01T08:22:17.333Z"
 *                   pagination:
 *                     page: 1
 *                     nextPage: 2
 *                     previousPage: null
 *                     totalPages: 3
 *                     pageSize: 10
 *                     totalCount: 25
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - You don't have permission to access this resource
 */
router.get('/list', listGarageAdmin);

/**
 * @swagger
 * /garage-admin/detail/{id}:
 *   get:
 *     summary: Get garage admin details
 *     description: Retrieves detailed information about a specific garage admin
 *     tags:
 *       - Garage Admin Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the garage admin
 *         schema:
 *           type: string
 *           example: "651aa63ff5e9d8593a4f9853"
 *     responses:
 *       200:
 *         description: Garage admin details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Garage admin details retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/GarageAdmin'
 *             examples:
 *               garageAdminDetailExample:
 *                 value:
 *                   message: "Garage admin details retrieved successfully"
 *                   data:
 *                     _id: "651aa63ff5e9d8593a4f9853"
 *                     name: "Robert Garcia"
 *                     email: "robert.garage@example.com"
 *                     userType: "garage-admin"
 *                     garageName: "Quick Fix Auto"
 *                     address: "123 Main Street, New York, NY 10001"
 *                     contactNumber: "212-555-1234"
 *                     status: "active"
 *                     createdAt: "2023-10-02T10:15:27.859Z"
 *                     garage:
 *                       _id: "651aa63ff5e9d8593a4f9860"
 *                       name: "Quick Fix Auto"
 *                       address: "123 Main Street, New York, NY 10001"
 *                       phone: "212-555-1234"
 *       404:
 *         description: Garage admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Garage admin not found"
 *       422:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ID format"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/detail/:id', getGarageAdminDetail);

/**
 * @swagger
 * /garage-admin/update/{id}:
 *   put:
 *     summary: Update Existing Garage Admin
 *     description: Updates the details of an existing garage admin
 *     tags:
 *       - Garage Admin Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: "651aa63ff5e9d8593a4f9853"
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
 *                 example: "Updated Garage Admin Name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "updatedgarageadmin@yopmail.com"
 *               garageName:
 *                 type: string
 *                 example: "Updated Star Garage"
 *               address:
 *                 type: string
 *                 example: "456 New St, City"
 *               contactNumber:
 *                 type: string
 *                 example: "+9876543210"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *           examples:
 *             updateGarageAdminExample:
 *               value:
 *                 name: "Updated Garage Admin Name"
 *                 email: "updatedgarageadmin@yopmail.com"
 *                 garageName: "Updated Star Garage"
 *                 address: "456 New St, City"
 *                 contactNumber: "+9876543210"
 *                 status: "active"
 *     responses:
 *       200:
 *         description: Garage admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Garage admin updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/GarageAdmin'
 *             examples:
 *               updateGarageAdminResponseExample:
 *                 value:
 *                   message: "Garage admin updated successfully"
 *                   data:
 *                     _id: "651aa63ff5e9d8593a4f9853"
 *                     name: "Updated Garage Admin Name"
 *                     email: "updatedgarageadmin@yopmail.com"
 *                     userType: "garage-admin"
 *                     garageName: "Updated Star Garage"
 *                     address: "456 New St, City"
 *                     contactNumber: "+9876543210"
 *                     status: "active"
 *       404:
 *         description: Garage admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Garage admin not found"
 *       422:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid input data"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.put('/update/:id', updateGarageAdmin);

/**
 * @swagger
 * /garage-admin/delete/{id}:
 *   delete:
 *     summary: Delete a garage admin
 *     description: Permanently removes a garage admin from the system
 *     tags:
 *       - Garage Admin Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the garage admin to delete
 *         schema:
 *           type: string
 *           example: "651aa63ff5e9d8593a4f9853"
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
 *                   example: "Garage admin deleted successfully"
 *             examples:
 *               deleteGarageAdminResponseExample:
 *                 value:
 *                   message: "Garage admin deleted successfully"
 *       404:
 *         description: Garage admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Garage admin not found"
 *       422:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ID format"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.delete('/delete/:id', deleteGarageAdmin);

export default router;

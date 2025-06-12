import { Router } from 'express';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';
import {
    createGarage,
    listGarages,
    getGarageDetail,
    updateGarage,
    deleteGarage,
} from '../../controllers/garage/garage.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Garage:
 *       type: object
 *       properties:
 *         ownerId:
 *           type: string
 *           description: Reference to garage owner
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           description: Name of the garage
 *           example: Quick Fix Auto Repair
 *         address:
 *           type: string
 *           description: Physical address of the garage
 *           example: 123 Main Street, Anytown, CA 12345
 *         phone:
 *           type: string
 *           description: Contact number of the garage
 *           example: (555) 123-4567
 *         pincode:
 *           type: string
 *           description: Postal/ZIP code
 *           example: 12345
 *         mapLink:
 *           type: string
 *           description: Google Maps or similar link
 *           example: https://goo.gl/maps/example123
 *         latitude:
 *           type: number
 *           description: Geographical latitude coordinate
 *           example: 37.7749
 *         longitude:
 *           type: number
 *           description: Geographical longitude coordinate
 *           example: -122.4194
 *         website:
 *           type: string
 *           description: Garage website URL
 *           example: https://quickfixauto.example.com
 *         description:
 *           type: string
 *           description: Detailed description of the garage
 *           example: "Quick Fix Auto Repair offers comprehensive automotive services including oil changes, brake repairs, and engine diagnostics. Our certified technicians provide quality service with a customer satisfaction guarantee."
 *         rating:
 *           type: object
 *           description: Rating information
 *           properties:
 *             average:
 *               type: number
 *               description: Average overall rating
 *               example: 4.7
 *             serviceQuality:
 *               type: number
 *               description: Rating for service quality
 *               example: 4.8
 *             valueForMoney:
 *               type: number
 *               description: Rating for value for money
 *               example: 4.5
 *             punctuality:
 *               type: number
 *               description: Rating for punctuality
 *               example: 4.6
 *             totalReviews:
 *               type: number
 *               description: Total number of reviews
 *               example: 127
 *         priceRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               description: Minimum price for services
 *               example: 29.99
 *             max:
 *               type: number
 *               description: Maximum price for services
 *               example: 499.99
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *           example: ["/uploads/garages/storefront.jpg", "/uploads/garages/workshop.jpg", "/uploads/garages/waiting-area.jpg"]
 *         pickupDropAvailable:
 *           type: boolean
 *           description: Whether pickup and drop service is available
 *           example: true
 *         timeSlots:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 description: Day of week
 *                 example: Monday
 *               open:
 *                 type: string
 *                 description: Opening time
 *                 example: "08:00"
 *               close:
 *                 type: string
 *                 description: Closing time
 *                 example: "18:00"
 *               isClosed:
 *                 type: boolean
 *                 description: Whether closed on this day
 *                 example: false
 *           example:
 *             [
 *               {"day": "Monday", "open": "08:00", "close": "18:00", "isClosed": false},
 *               {"day": "Tuesday", "open": "08:00", "close": "18:00", "isClosed": false},
 *               {"day": "Wednesday", "open": "08:00", "close": "18:00", "isClosed": false},
 *               {"day": "Thursday", "open": "08:00", "close": "18:00", "isClosed": false},
 *               {"day": "Friday", "open": "08:00", "close": "18:00", "isClosed": false},
 *               {"day": "Saturday", "open": "09:00", "close": "15:00", "isClosed": false},
 *               {"day": "Sunday", "open": "00:00", "close": "00:00", "isClosed": true}
 *             ]
 *       required:
 *         - ownerId
 *         - name
 *         - address
 *         - phone
 */

/**
 * @swagger
 * /garages:
 *   post:
 *     summary: Create a new garage
 *     tags:
 *       - Garage Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Garage'
 *           example:
 *             {
 *               "ownerId": "60d21b4667d0d8992e610c85",
 *               "name": "Quick Fix Auto Repair",
 *               "address": "123 Main Street, Anytown, CA 12345",
 *               "phone": "(555) 123-4567",
 *               "pincode": "12345",
 *               "mapLink": "https://goo.gl/maps/example123",
 *               "latitude": 37.7749,
 *               "longitude": -122.4194,
 *               "website": "https://quickfixauto.example.com",
 *               "description": "Quick Fix Auto Repair offers comprehensive automotive services including oil changes, brake repairs, and engine diagnostics. Our certified technicians provide quality service with a customer satisfaction guarantee.",
 *               "priceRange": {
 *                 "min": 29.99,
 *                 "max": 499.99
 *               },
 *               "images": ["/uploads/garages/storefront.jpg", "/uploads/garages/workshop.jpg"],
 *               "pickupDropAvailable": true,
 *               "timeSlots": [
 *                 {"day": "Monday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                 {"day": "Tuesday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                 {"day": "Wednesday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                 {"day": "Thursday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                 {"day": "Friday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                 {"day": "Saturday", "open": "09:00", "close": "15:00", "isClosed": false},
 *                 {"day": "Sunday", "open": "00:00", "close": "00:00", "isClosed": true}
 *               ]
 *             }
 *     responses:
 *       200:
 *         description: Garage created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Garage'
 *             example:
 *               {
 *                 "message": "Garage created successfully",
 *                 "data": {
 *                   "_id": "60d21b4667d0d8992e610c99",
 *                   "ownerId": "60d21b4667d0d8992e610c85",
 *                   "name": "Quick Fix Auto Repair",
 *                   "address": "123 Main Street, Anytown, CA 12345",
 *                   "phone": "(555) 123-4567",
 *                   "pincode": "12345",
 *                   "mapLink": "https://goo.gl/maps/example123",
 *                   "latitude": 37.7749,
 *                   "longitude": -122.4194,
 *                   "website": "https://quickfixauto.example.com",
 *                   "description": "Quick Fix Auto Repair offers comprehensive automotive services...",
 *                   "priceRange": {
 *                     "min": 29.99,
 *                     "max": 499.99
 *                   },
 *                   "images": ["/uploads/garages/storefront.jpg", "/uploads/garages/workshop.jpg"],
 *                   "pickupDropAvailable": true,
 *                   "timeSlots": [
 *                     {"day": "Monday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                     {"day": "Tuesday", "open": "08:00", "close": "18:00", "isClosed": false}
 *                   ],
 *                   "createdAt": "2023-06-20T12:30:45.000Z",
 *                   "updatedAt": "2023-06-20T12:30:45.000Z",
 *                   "rating": {
 *                     "average": 0,
 *                     "serviceQuality": 0,
 *                     "valueForMoney": 0,
 *                     "punctuality": 0,
 *                     "totalReviews": 0
 *                   }
 *                 }
 *               }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Validation error",
 *                 "errors": [
 *                   {
 *                     "field": "name",
 *                     "message": "Name is required"
 *                   },
 *                   {
 *                     "field": "address",
 *                     "message": "Address is required"
 *                   }
 *                 ]
 *               }
 */
router.post(
    '/',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    createGarage,
);

/**
 * @swagger
 * /garages:
 *   get:
 *     summary: Get a paginated list of garages
 *     tags:
 *       - Garage Management
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default is 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page (default is 10)
 *         example: 10
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Text to search in name, address or description
 *         example: Auto Repair
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [name, createdAt, rating]
 *         description: Field to sort by
 *         example: rating
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *         description: Sort order (1 for ascending, -1 for descending)
 *         example: -1
 *     responses:
 *       200:
 *         description: List of garages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garages retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       address:
 *                         type: string
 *                       rating:
 *                         type: object
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
 *             example:
 *               {
 *                 "message": "Garages retrieved successfully",
 *                 "data": [
 *                   {
 *                     "_id": "60d21b4667d0d8992e610c99",
 *                     "name": "Quick Fix Auto Repair",
 *                     "address": "123 Main Street, Anytown, CA 12345",
 *                     "phone": "(555) 123-4567",
 *                     "rating": {
 *                       "average": 4.7,
 *                       "totalReviews": 127
 *                     },
 *                     "images": ["/uploads/garages/storefront.jpg"],
 *                     "pickupDropAvailable": true,
 *                     "priceRange": {
 *                       "min": 29.99,
 *                       "max": 499.99
 *                     }
 *                   },
 *                   {
 *                     "_id": "60d21b4667d0d8992e610c98",
 *                     "name": "City Auto Works",
 *                     "address": "456 Oak Avenue, Metropolis, NY 54321",
 *                     "phone": "(555) 987-6543",
 *                     "rating": {
 *                       "average": 4.5,
 *                       "totalReviews": 89
 *                     },
 *                     "images": ["/uploads/garages/cityauto.jpg"],
 *                     "pickupDropAvailable": false,
 *                     "priceRange": {
 *                       "min": 39.99,
 *                       "max": 599.99
 *                     }
 *                   }
 *                 ],
 *                 "pagination": {
 *                   "page": 1,
 *                   "nextPage": 2,
 *                   "previousPage": null,
 *                   "totalPages": 5,
 *                   "pageSize": 10,
 *                   "totalCount": 42
 *                 }
 *               }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Internal server error",
 *                 "error": "Database connection failed"
 *               }
 */
router.get('/', listGarages);

/**
 * @swagger
 * /garages/{id}:
 *   get:
 *     summary: Get garage details
 *     tags:
 *       - Garage Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the garage
 *         schema:
 *           type: string
 *         example: 60d21b4667d0d8992e610c99
 *     responses:
 *       200:
 *         description: Garage details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage details retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Garage'
 *             example:
 *               {
 *                 "message": "Garage details retrieved successfully",
 *                 "data": {
 *                   "_id": "60d21b4667d0d8992e610c99",
 *                   "ownerId": {
 *                     "_id": "60d21b4667d0d8992e610c85",
 *                     "name": "John Smith",
 *                     "email": "john@example.com"
 *                   },
 *                   "name": "Quick Fix Auto Repair",
 *                   "address": "123 Main Street, Anytown, CA 12345",
 *                   "phone": "(555) 123-4567",
 *                   "pincode": "12345",
 *                   "mapLink": "https://goo.gl/maps/example123",
 *                   "latitude": 37.7749,
 *                   "longitude": -122.4194,
 *                   "website": "https://quickfixauto.example.com",
 *                   "description": "Quick Fix Auto Repair offers comprehensive automotive services...",
 *                   "rating": {
 *                     "average": 4.7,
 *                     "serviceQuality": 4.8,
 *                     "valueForMoney": 4.5,
 *                     "punctuality": 4.6,
 *                     "totalReviews": 127
 *                   },
 *                   "priceRange": {
 *                     "min": 29.99,
 *                     "max": 499.99
 *                   },
 *                   "images": ["/uploads/garages/storefront.jpg", "/uploads/garages/workshop.jpg"],
 *                   "pickupDropAvailable": true,
 *                   "timeSlots": [
 *                     {"day": "Monday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                     {"day": "Tuesday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                     {"day": "Wednesday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                     {"day": "Thursday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                     {"day": "Friday", "open": "08:00", "close": "18:00", "isClosed": false},
 *                     {"day": "Saturday", "open": "09:00", "close": "15:00", "isClosed": false},
 *                     {"day": "Sunday", "open": "00:00", "close": "00:00", "isClosed": true}
 *                   ],
 *                   "createdAt": "2023-06-20T12:30:45.000Z",
 *                   "updatedAt": "2023-06-20T12:30:45.000Z"
 *                 }
 *               }
 *       404:
 *         description: Garage not found
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Garage not found"
 *               }
 *       422:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Invalid garage ID format"
 *               }
 */
router.get('/:id', getGarageDetail);

/**
 * @swagger
 * /garages/{id}:
 *   put:
 *     summary: Update existing garage
 *     tags:
 *       - Garage Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Garage ID to update
 *         example: 60d21b4667d0d8992e610c99
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *           example:
 *             {
 *               "name": "Quick Fix Auto Repair & Detailing",
 *               "phone": "(555) 123-9876",
 *               "website": "https://quickfixautodetailing.example.com",
 *               "description": "Quick Fix Auto now offers premium detailing services in addition to our comprehensive automotive repairs.",
 *               "pickupDropAvailable": true,
 *               "timeSlots": [
 *                 {"day": "Monday", "open": "08:00", "close": "19:00", "isClosed": false},
 *                 {"day": "Saturday", "open": "09:00", "close": "17:00", "isClosed": false}
 *               ]
 *             }
 *     responses:
 *       200:
 *         description: Garage updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Garage'
 *             example:
 *               {
 *                 "message": "Garage updated successfully",
 *                 "data": {
 *                   "_id": "60d21b4667d0d8992e610c99",
 *                   "name": "Quick Fix Auto Repair & Detailing",
 *                   "address": "123 Main Street, Anytown, CA 12345",
 *                   "phone": "(555) 123-9876",
 *                   "website": "https://quickfixautodetailing.example.com",
 *                   "description": "Quick Fix Auto now offers premium detailing services...",
 *                   "timeSlots": [
 *                     {"day": "Monday", "open": "08:00", "close": "19:00", "isClosed": false},
 *                     {"day": "Saturday", "open": "09:00", "close": "17:00", "isClosed": false}
 *                   ],
 *                   "pickupDropAvailable": true,
 *                   "updatedAt": "2023-06-22T14:25:30.000Z"
 *                 }
 *               }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Authentication required"
 *               }
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "You don't have permission to update this garage"
 *               }
 *       404:
 *         description: Garage not found
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Garage not found"
 *               }
 *       422:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Validation error",
 *                 "errors": [
 *                   {
 *                     "field": "phone",
 *                     "message": "Invalid phone number format"
 *                   }
 *                 ]
 *               }
 */
router.put(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    updateGarage,
);

/**
 * @swagger
 * /garages/{id}:
 *   delete:
 *     summary: Delete a garage
 *     tags:
 *       - Garage Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the garage to delete
 *         schema:
 *           type: string
 *         example: 60d21b4667d0d8992e610c99
 *     responses:
 *       200:
 *         description: Garage deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Garage deleted successfully
 *             example:
 *               {
 *                 "message": "Garage deleted successfully"
 *               }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Authentication required"
 *               }
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "You don't have permission to delete this garage"
 *               }
 *       404:
 *         description: Garage not found
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Garage not found"
 *               }
 *       422:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "message": "Invalid garage ID format"
 *               }
 */
router.delete(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    deleteGarage,
);

export default router;

import { Router } from 'express';
import { USER_TYPES } from '../constants/common.constant.js';
import { authorize } from '../middlewares/authorize.middleware.js';

// Import routes
import authRoutes from './auth.route.js';
import adminManagementRoutes from './adminRoutes/adminManagement.route.js';
import userManagementRoutes from './userRoutes/userManagement.route.js';
import garageAdminRoutes from './garageAdminRoutes/garageAdminManagement.route.js';
import garageRoutes from './garage/garage.route.js';

// Import registration routes (public)
import garageAdminRegistrationRoutes from './garageAdminRoutes/authFree.route.js';
import userRegistrationRoutes from './userRoutes/authFree.route.js';

// Add these imports
import serviceRoutes from './service/service.route.js';
import transportRoutes from './transport/transport.route.js';
import blogRoutes from './blog/blog.route.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/garage-admin-registration', garageAdminRegistrationRoutes);
router.use('/user-registration', userRegistrationRoutes);

// Protected routes with role-based access
router.use('/admin', authorize([USER_TYPES.SUPERADMIN]), adminManagementRoutes);
router.use('/garage-admin', authorize([USER_TYPES.ADMIN]), garageAdminRoutes);
router.use('/user', authorize([USER_TYPES.USER]), userManagementRoutes);
router.use('/garages', garageRoutes);

// Add these routes to your router
router.use('/services', serviceRoutes);
router.use('/transports', transportRoutes);
router.use('/blogs', blogRoutes);

export default router;

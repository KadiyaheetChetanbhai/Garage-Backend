import { Router } from 'express';
import { USER_TYPES } from '../constants/common.constant.js';
import { authorize } from '../middlewares/authorize.middleware.js';

// Import routes
import adminManagementRoutes from './adminRoutes/adminManagement.route.js';
import authRoutes from './auth.route.js';
import garageRoutes from './garage/garage.route.js';
import garageAdminRoutes from './garageAdminRoutes/garageAdminManagement.route.js';
import userManagementRoutes from './userRoutes/userManagement.route.js';

// Import registration routes (public)
import registerRoutes from './register.route.js';

// Add these imports
import blogRoutes from './blog/blog.route.js';
import bookingRoutes from './booking/booking.route.js';
import serviceRoutes from './service/service.route.js';
import transportRoutes from './transport/transport.route.js';
import categoryRoutes from './categoryRoutes/category.route.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/register', registerRoutes);

// Protected routes with role-based access
router.use('/admin', authorize([USER_TYPES.SUPERADMIN]), adminManagementRoutes);
router.use(
    '/garage-admin',
    authorize([USER_TYPES.GARAGE_ADMIN]),
    garageAdminRoutes,
);
router.use('/user', authorize([USER_TYPES.USER]), userManagementRoutes);
router.use('/garages', garageRoutes);

// Add these routes to your router
router.use('/services', serviceRoutes);
router.use('/transports', transportRoutes);
router.use('/blogs', blogRoutes);
router.use('/bookings', bookingRoutes);
router.use('/categories', categoryRoutes);

export default router;

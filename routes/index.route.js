import { Router } from 'express';
import { USER_TYPES } from '../constants/common.constant.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import adminManagementRoutes from './adminRoutes/adminManagement.route.js';
import authRoutes from './auth.route.js';

import commonRoutes from './common.route.js';

const router = Router();
router.use('/admin', authRoutes);
router.use('/admin', authorize([USER_TYPES.ADMIN]), adminManagementRoutes);

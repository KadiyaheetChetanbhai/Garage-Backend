import { Router } from 'express';
import {
    forgotPassword,
    login,
    logout,
    updatePassword,
    verifyForgotPasswordRequest,
} from '../controllers/auth.controller.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

/**
 * @swagger
 * /auth/login/{userType}:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login for all user types
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, garage-admin, user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 userType:
 *                   type: string
 */
router.post('/login/:userType', login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout for all user types
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authorize(), logout);

/**
 * @swagger
 * /auth/forgot-password/{userType}:
 *   post:
 *     summary: Request password reset for any user type
 *     tags:
 *       - Password Management
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, garage-admin, user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 */
router.post('/forgot-password/:userType', forgotPassword);

/**
 * @swagger
 * /auth/verify-forgot-password-request/{userType}:
 *   post:
 *     summary: Verify password reset request for any user type
 *     tags:
 *       - Password Management
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, garage-admin, user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: number
 *             required:
 *               - email
 *               - otp
 */
router.post(
    '/verify-forgot-password-request/:userType',
    verifyForgotPasswordRequest,
);

/**
 * @swagger
 * /auth/update-password/{userType}:
 *   post:
 *     summary: Update password for any user type
 *     tags:
 *       - Password Management
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, garage-admin, user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *               forgotPasswordRequestId:
 *                 type: string
 *             required:
 *               - newPassword
 *               - forgotPasswordRequestId
 */
router.post('/update-password/:userType', updatePassword);

export default router;

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
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: petnowadmin@yopmail.com
 *         password:
 *           type: string
 *           format: password
 *           example: Pa$w0rd!
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: petnowadmin@yopmail.com
 *     VerifyOTPRequest:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: petnowadmin@yopmail.com
 *         otp:
 *           type: number
 *           example: 123456
 *     UpdatePasswordRequest:
 *       type: object
 *       required:
 *         - newPassword
 *         - forgotPasswordRequestId
 *       properties:
 *         newPassword:
 *           type: string
 *           format: password
 *           example: NewPa$w0rd!
 *         forgotPasswordRequestId:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 */

/**
 * @swagger
 * /auth/login/{userType}:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login for all user types
 *     description: Use this endpoint to authenticate users and receive an access token
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [superadmin, garage-admin, user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
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
 *                   example: Logged in successfully
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 userType:
 *                   type: string
 *                   example: superadmin
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     name:
 *                       type: string
 *                       example: SuperAdmin
 *                     email:
 *                       type: string
 *                       example: petnowadmin@yopmail.com
 *       401:
 *         description: Invalid credentials
 *       422:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/login/:userType', login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout for all user types
 *     description: Invalidates the current session token
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authorize(), logout);

/**
 * @swagger
 * /auth/forgot-password/{userType}:
 *   post:
 *     summary: Request password reset for any user type
 *     description: Sends an OTP to the user's email for password reset
 *     tags:
 *       - Password Management
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [superadmin, garage-admin, user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent to your email
 *                 email:
 *                   type: string
 *                   example: petnowadmin@yopmail.com
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password/:userType', forgotPassword);

/**
 * @swagger
 * /auth/verify-forgot-password-request/{userType}:
 *   post:
 *     summary: Verify password reset request for any user type
 *     description: Validates the OTP sent to the user's email
 *     tags:
 *       - Password Management
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [superadmin, garage-admin, user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOTPRequest'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *                 forgotPasswordRequestId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
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
 *     description: Sets a new password after OTP verification
 *     tags:
 *       - Password Management
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [superadmin, garage-admin, user]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Invalid or expired request
 *       404:
 *         description: User not found
 */
router.post('/update-password/:userType', updatePassword);

export default router;

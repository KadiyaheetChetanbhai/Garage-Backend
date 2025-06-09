import { Router } from 'express';
import {
    forgotPassword,
    login,
    logout,
    updatePassword,
    verifyForgotPasswordRequest,
} from '../controllers/auth.controller.js';
import { USER_TYPES } from '../constants/common.constant.js';
import { authorize } from '../middlewares/authorize.middleware.js';
const router = Router();

/**
 * @swagger
 * /admin/login:
 *   post:
 *     tags:
 *       - Admin Authentication
 *     summary: Login a user
 *     description: Authenticates a user using email and password and returns a token.
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
 *                 example: petnowadmin@yopmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Pa$w0rd!
 *     responses:
 *       200:
 *         description: Login successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successfully
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', login);

/**
 * @swagger
 * /admin/logout:
 *   post:
 *     summary: User logout
 *     tags:
 *       - Admin Authentication
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authorize([USER_TYPES.ADMIN]), logout);

/**
 * @swagger
 * /admin/forgot-password:
 *   post:
 *     summary: Request for password reset
 *     tags:
 *       - Admin Forgot Password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: petnowadmin@yopmail.com
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Forgot password email sended successfully
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /admin/verify-forgot-password-request:
 *   post:
 *     summary: Verify password reset request
 *     tags:
 *       - Admin Forgot Password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: petnowadmin@yopmail.com
 *               otp:
 *                 type: number
 *                 example: 342423
 *             required:
 *               - email
 *               - otp
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
 *                   example: "OTP verified successfully"
 *                 forgotPasswordRequestId:
 *                   type: string
 *                   example: "67f7b7d15609ddc87d0a38ee"
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-forgot-password-request', verifyForgotPasswordRequest);

/**
 * @swagger
 * /admin/update-password:
 *   post:
 *     summary: Update user password
 *     tags:
 *       - Admin Forgot Password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: NewPassword
 *               forgotPasswordRequestId:
 *                 type: string
 *                 example: "675954cfd1c3aff9bc0fb7b5"
 *             required:
 *               - newPassword
 *               - forgotPasswordRequestId
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *       404:
 *         description: Forgot password request not found
 */
router.post('/update-password', updatePassword);

export default router;

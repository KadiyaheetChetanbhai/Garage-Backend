import {
    MAX_RESET_PASS_REQUESTS_PER_DAY,
    OTP_EXPIRATION_MINUTES,
} from '../constants/common.constant.js';
import { sendMail } from '../mail/sendMail.js';
import ForgotPasswordRequest from '../models/forgotPasswordRequest.model.js';
import User from '../models/user.model.js';
import {
    errorResponse,
    findUserByEmail,
    generateOTP,
    getExpiryDate,
    getTodayDate,
    signAccessToken,
    successResponse,
} from '../helpers/general.helper.js';
import {
    forgotPasswordSchema,
    loginSchema,
    updatePasswordValidator,
    verifyForgotPasswordSchema,
} from '../validators/auth.validator.js';

export const login = async (req, res) => {
    try {
        const result = await loginSchema.validateAsync(req.body);

        const { user, userType } = await findUserByEmail(result.email);
        if (!user) {
            return errorResponse(res, { message: 'Invalid credentials' }, 401);
        }

        const isMatch = await user.isValidPassword(result.password);
        if (!isMatch) {
            return errorResponse(res, { message: 'Invalid credentials' }, 401);
        }

        const token = await signAccessToken(user._id.toString(), userType);
        user.jwtToken = token;
        await user.save();

        return successResponse(res, {
            message: 'Logged in successfully',
            token,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const logout = async (req, res) => {
    try {
        const user = req.user;
        user.jwtToken = null;
        await user.save();
        return successResponse(res, {
            message: 'Logged out successfully',
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = await forgotPasswordSchema.validateAsync(req.body);

        const { user, userType } = await findUserByEmail(email);
        if (!user)
            return errorResponse(res, { message: 'User not found' }, 404);

        const count = await ForgotPasswordRequest.countDocuments({
            userId: user._id,
            userType,
            createdAt: { $gte: getTodayDate() },
        });

        if (count >= MAX_RESET_PASS_REQUESTS_PER_DAY) {
            return errorResponse(
                res,
                {
                    message: 'Password reset request limit reached',
                },
                429,
            );
        }

        const otp = generateOTP();
        await ForgotPasswordRequest.create({
            userId: user._id,
            userType,
            otp,
            expiresAt: getExpiryDate(OTP_EXPIRATION_MINUTES),
        });

        sendMail({
            to: user.email,
            subject: 'Forgot Password',
            type: 'resetPassword',
            data: { otp, expiresIn: OTP_EXPIRATION_MINUTES },
        });

        return successResponse(res, {
            message: 'OTP sent successfully',
        });
    } catch (error) {
        return errorResponse(res, { message: error.message }, 500, error);
    }
};

export const verifyForgotPasswordRequest = async (req, res) => {
    try {
        const result = await verifyForgotPasswordSchema.validateAsync(req.body);

        const user = await User.findOne({ email: result.email });
        if (!user)
            return errorResponse(res, { message: 'User not found' }, 404);

        const forgotPasswordRequest = await ForgotPasswordRequest.findOne({
            userId: user._id,
            verifiedAt: null,
        }).sort({ createdAt: -1 });
        if (!forgotPasswordRequest) {
            return errorResponse(
                res,
                { message: 'Forgot password request not found' },
                404,
            );
        }
        if (forgotPasswordRequest.otp !== result.otp) {
            return errorResponse(res, { message: 'Invalid OTP' }, 422);
        }
        if (forgotPasswordRequest.expiresAt < Date.now()) {
            return errorResponse(res, { message: 'OTP has been expired' }, 422);
        }

        forgotPasswordRequest.verifiedAt = new Date();
        await forgotPasswordRequest.save();

        return successResponse(res, {
            message: 'OTP verified successfully',
            forgotPasswordRequestId: forgotPasswordRequest._id,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

export const updatePassword = async (req, res) => {
    try {
        const result = await updatePasswordValidator.validateAsync(req.body);
        const { forgotPasswordRequestId, newPassword } = result;

        const forgotPasswordRequest = await ForgotPasswordRequest.findById(
            forgotPasswordRequestId,
        );
        if (!forgotPasswordRequest || !forgotPasswordRequest.verifiedAt) {
            return errorResponse(
                res,
                { message: 'Forgot password request not found ' },
                404,
            );
        }

        if (forgotPasswordRequest.expiresAt < Date.now()) {
            return errorResponse(
                res,
                { message: 'Forgot password request has been expired' },
                422,
            );
        }
        const userModel = getUserModel(forgotPasswordRequest.userType);
        const user = await userModel.findById(forgotPasswordRequest.userId);
        if (!user)
            return errorResponse(res, { message: 'User not found' }, 404);
        user.password = newPassword;
        await user.save();
        forgotPasswordRequest.expiresAt = Date.now();
        await forgotPasswordRequest.save();
        return successResponse(res, {
            message: 'Password updated successfully',
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Something went wrong', error: error.message },
            500,
            error,
        );
    }
};

import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { errorResponse } from '../helpers/general.helper.js';

export const authorize = (userTypes = []) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return errorResponse(
                    res,
                    { message: 'No token provided' },
                    401,
                );
            }

            const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.userId = payload.aud;

            req.userType = payload.userType;

            const user = await User.findById(req.userId);
            if (!user) {
                return errorResponse(
                    res,
                    { message: 'Unauthorized, User not found' },
                    401,
                );
            }
            req.user = user;
            if (!user.jwtToken || user.jwtToken !== token) {
                return errorResponse(
                    res,
                    { message: 'You have been logged out' },
                    401,
                );
            }

            if (!userTypes || userTypes.length === 0) {
                return next();
            }

            if (!userTypes.includes(req.userType)) {
                return errorResponse(
                    res,
                    {
                        message:
                            'Access denied. You do not have the required permissions.',
                    },
                    403,
                );
            }
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return errorResponse(res, { message: 'Unauthorized' }, 401);
            } else if (error.name === 'TokenExpiredError') {
                return errorResponse(
                    res,
                    { message: 'Your session has expired' },
                    401,
                );
            }
            return errorResponse(
                res,
                { message: 'Something went wrong', error: error.message },
                500,
            );
        }
    };
};

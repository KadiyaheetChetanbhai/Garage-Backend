import Permission from '../models/permission.model.js';
import { errorResponse } from '../helpers/general.helper.js';

export const hasPermission = (name, event) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user.permissions || user.permissions.length === 0) {
                return errorResponse(
                    res,
                    {
                        message:
                            'Access denied. You do not have the required permissions',
                    },
                    403,
                );
            }
            const existingPermission = await Permission.findOne({
                name,
                event,
            });
            if (!existingPermission) {
                return errorResponse(
                    res,
                    { message: 'Permission not found' },
                    404,
                );
            }

            if (!user.permissions.includes(existingPermission._id)) {
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
            return errorResponse(
                res,
                { message: 'Something went wrong', error: error.message },
                500,
            );
        }
    };
};

import mongoose from 'mongoose';
import {
    MODULES,
    PERMISSION_EVENTS,
} from '../constants/permission.constant.js';

const permissionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            enum: Object.values(MODULES),
        },
        module: {
            type: String,
            enum: Object.keys(MODULES),
            required: true,
        },
        event: {
            type: String,
            enum: Object.values(PERMISSION_EVENTS),
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

const Permission = mongoose.model('Permission', permissionSchema);
export default Permission;

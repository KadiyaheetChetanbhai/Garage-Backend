import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_TYPES } from '../constants/common.constant.js';

const superAdminSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        userType: {
            type: String,
            enum: Object.values(USER_TYPES.SUPERADMIN),
            required: true,
        },
        password: { type: String, required: true },
        jwtToken: { type: String, default: null },
        isEditable: { type: Boolean, default: true },
        permissions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Permission',
            },
        ],
    },
    {
        timestamps: true,
    },
);
superAdminSchema.pre('save', async function (next) {
    try {
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next();
    } catch (error) {
        next(error);
    }
});

superAdminSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const superAdmin = mongoose.model('superAdmin', superAdminSchema);
export default superAdmin;

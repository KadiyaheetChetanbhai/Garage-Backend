import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_TYPES } from '../constants/common.constant.js';

const garageOwnerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true, // This automatically converts to lowercase when saving
        },
        userType: {
            type: String,
            enum: Object.values(USER_TYPES),
            default: USER_TYPES.GARAGE_ADMIN,
            required: true,
        },
        password: { type: String, required: true },
        garage: {
            ref: 'Garage',
            type: mongoose.Schema.Types.ObjectId,
        },
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
garageOwnerSchema.pre('save', async function (next) {
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

garageOwnerSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const garageOwner = mongoose.model('garageOwner', garageOwnerSchema);
export default garageOwner;

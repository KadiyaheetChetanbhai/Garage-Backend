import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_TYPES } from '../constants/common.constant.js';

const userSchema = new mongoose.Schema(
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
            default: USER_TYPES.USER,
            required: true,
        },
        password: { type: String, required: true },
        jwtToken: { type: String, default: null },
        isEditable: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    },
);
userSchema.pre('save', async function (next) {
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

userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

import mongoose from 'mongoose';
const { Schema } = mongoose;

const forgotPasswordRequestSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        otp: { type: Number },
        expiresAt: {
            type: Date,
        },
        verifiedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

const ForgotPasswordRequest = mongoose.model(
    'ForgotPasswordRequest',
    forgotPasswordRequestSchema,
);
export default ForgotPasswordRequest;

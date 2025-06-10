import mongoose from 'mongoose';
const { Schema } = mongoose;

const forgotPasswordRequestSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userType: {
            type: String,
            enum: ['customer', 'garageOwner', 'superAdmin'],
            required: true,
        },
        otp: {
            type: Number,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        verifiedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

const ForgotPasswordRequest = mongoose.model(
    'ForgotPasswordRequest',
    forgotPasswordRequestSchema,
);

export default ForgotPasswordRequest;

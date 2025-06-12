import mongoose from 'mongoose';
import { DAYS_OF_WEEK_ARRAY } from '../constants/common.constant.js';

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        price: {
            type: Number,
            required: true,
        },
        duration: {
            type: Number, // Duration in minutes
            required: true,
        },
        
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        garage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Garage',
            required: true,
        },
        availableTimeSlots: [
            {
                day: {
                    type: String,
                    required: true,
                    enum: DAYS_OF_WEEK_ARRAY,
                },
                open: { type: String, required: true },
                close: { type: String, required: true },
                isClosed: { type: Boolean, default: false },
            },
        ],
    },
    {
        timestamps: true,
    },
);

// Create index for faster queries
serviceSchema.index({ garage: 1, category: 1 });
serviceSchema.index({ isActive: 1 });

const Service = mongoose.model('Service', serviceSchema);
export default Service;

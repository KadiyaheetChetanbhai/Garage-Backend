import mongoose from 'mongoose';

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
            type: String,
            enum: [
                'repair',
                'maintenance',
                'inspection',
                'customization',
                'other',
            ],
            required: true,
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

const Service = mongoose.model('Service', serviceSchema);
export default Service;

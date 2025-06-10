import mongoose from 'mongoose';

const transportSchema = new mongoose.Schema(
    {
        garageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Garage',
            required: true,
        },
        vehicleType: {
            type: String,
            enum: ['car', 'van', 'truck', 'motorcycle', 'other'],
            required: true,
        },
        vehicleName: {
            type: String,
            required: true,
        },
        vehicleNumber: {
            type: String,
            required: true,
        },
        capacity: {
            type: Number,
            default: 1,
        },
        driverName: {
            type: String,
        },
        driverContact: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        note: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

const Transport = mongoose.model('Transport', transportSchema);
export default Transport;

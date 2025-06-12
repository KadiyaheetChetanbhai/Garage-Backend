import mongoose from 'mongoose';
import { DAYS_OF_WEEK_ARRAY } from '../constants/common.constant.js';

const garageSchema = new mongoose.Schema(
    {
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'GarageOwner' },
        name: { type: String, required: true },
        address: { type: String, reqired: true },
        phone: { type: String, reqired: true, unique: true },
        pincode: { type: String },
        mapLink: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        website: { type: String },
        description: { type: String },
        rating: { type: Number },
        priceRange: {
            min: { type: Number },
            max: { type: Number },
        },
        images: [{ type: String }],
        servicesOffered: [
            { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
        ],
        pickupDropAvailable: { type: Boolean },
        timeSlots: [
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
        createdAt: { type: Date },
        updatedAt: { type: Date },
    },
    {
        timestamps: true,
    },
);

const Garage = mongoose.model('Garage', garageSchema);
export default Garage;

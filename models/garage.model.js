import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
                day: { type: String },
                open: { type: String },
                close: { type: String },
                isClosed: { type: Boolean },
            },
        ],
        createdAt: { type: Date },
        updatedAt: { type: Date },
    },
    {
        timestamps: true,
    },
);

const Garage = mongoose.model('garage', garageSchema);
export default Garage;

import mongoose from 'mongoose';

const transortPartnerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        contactNumber: { type: String, required: true },
        assignedBookings: [
            { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
        ],
        areaOfService: { type: String, required: true },
        availabilityStatus: { type: Boolean, default: true },
        createdAt: { type: Date },
        updatedAt: { type: Date },
    },
    { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

const transortPartner = mongoose.model(
    'transortPartner',
    transortPartnerSchema,
);
export default transortPartner;

import mongoose from 'mongoose';
import { DAYS_OF_WEEK_ARRAY } from '../constants/common.constant.js';

// Define booking status constants
export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

const bookingSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        garageId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Garage',
        },
        serviceIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Service',
                required: true,
            },
        ],
        date: { type: Date, required: true },
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
        pickupDrop: {
            opted: { type: Boolean, default: false },
            pickupAddress: { type: String },
            dropAddress: { type: String },
        },
        transportPartnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TransportPartner',
        },
        status: {
            type: String,
            enum: Object.values(BOOKING_STATUS),
            default: BOOKING_STATUS.PENDING,
        },
        totalAmount: { type: Number, required: true },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending',
        },
        invoiceUrl: { type: String },
        notes: { type: String },
        createdBy: {
            userId: { type: mongoose.Schema.Types.ObjectId, required: true },
            userType: { type: String, required: true },
        },
        reminderSent: {
            oneHour: { type: Boolean, default: false },
            twentyFourHour: { type: Boolean, default: false },
        },
    },
    { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

// Add indexes for better performance
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ garageId: 1, date: 1 });
bookingSchema.index({ date: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;

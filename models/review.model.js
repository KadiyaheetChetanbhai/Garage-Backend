import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        garageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Garage',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
        serviceQuality: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        valueForMoney: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        punctuality: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        response: {
            text: String,
            respondedAt: Date,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true },
);

// Create indexes
reviewSchema.index({ garageId: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;

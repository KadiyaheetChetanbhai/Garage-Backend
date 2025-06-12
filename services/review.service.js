import Review from '../models/review.model.js';
import Booking, { BOOKING_STATUS } from '../models/booking.model.js';
import Garage from '../models/garage.model.js';
import { sendMail } from '../mail/sendMail.js';

// Create a review
export const createReview = async (reviewData) => {
    try {
        const {
            bookingId,
            customerId,
            rating,
            comment,
            serviceQuality,
            valueForMoney,
            punctuality,
        } = reviewData;

        // Verify booking exists and is completed
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.status !== BOOKING_STATUS.COMPLETED) {
            throw new Error('Can only review completed bookings');
        }

        // Verify the customer is the one who made the booking
        if (booking.customerId.toString() !== customerId) {
            throw new Error('You can only review your own bookings');
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            throw new Error('You have already reviewed this booking');
        }

        // Create the review
        const review = new Review({
            bookingId,
            customerId,
            garageId: booking.garageId,
            rating,
            comment,
            serviceQuality,
            valueForMoney,
            punctuality,
        });

        await review.save();

        // Update garage average rating
        await updateGarageRating(booking.garageId);

        // Notify garage owner about new review
        await notifyGarageOwnerAboutReview(review);

        return review;
    } catch (error) {
        console.error('Error creating review:', error);
        throw error;
    }
};

// Update garage's average rating
const updateGarageRating = async (garageId) => {
    try {
        const reviews = await Review.find({ garageId, status: 'approved' });

        if (reviews.length === 0) return;

        const totalRating = reviews.reduce(
            (sum, review) => sum + review.rating,
            0,
        );
        const totalServiceQuality = reviews.reduce(
            (sum, review) => sum + review.serviceQuality,
            0,
        );
        const totalValueForMoney = reviews.reduce(
            (sum, review) => sum + review.valueForMoney,
            0,
        );
        const totalPunctuality = reviews.reduce(
            (sum, review) => sum + review.punctuality,
            0,
        );

        const avgRating = totalRating / reviews.length;
        const avgServiceQuality = totalServiceQuality / reviews.length;
        const avgValueForMoney = totalValueForMoney / reviews.length;
        const avgPunctuality = totalPunctuality / reviews.length;

        await Garage.findByIdAndUpdate(garageId, {
            rating: {
                average: avgRating.toFixed(1),
                serviceQuality: avgServiceQuality.toFixed(1),
                valueForMoney: avgValueForMoney.toFixed(1),
                punctuality: avgPunctuality.toFixed(1),
                totalReviews: reviews.length,
            },
        });
    } catch (error) {
        console.error('Error updating garage rating:', error);
    }
};

// Notify garage owner about new review
const notifyGarageOwnerAboutReview = async (review) => {
    try {
        const garage = await Garage.findById(review.garageId).populate(
            'ownerId',
            'name email',
        );

        if (!garage || !garage.ownerId) return;

        const booking = await Booking.findById(review.bookingId);
        if (!booking) return;

        await sendMail({
            to: garage.ownerId.email,
            subject: 'New Review for Your Garage',
            type: 'newReview',
            data: {
                name: garage.ownerId.name,
                garageName: garage.name,
                rating: review.rating,
                comment: review.comment,
                date: new Date().toLocaleDateString(),
                dashboardUrl: `${process.env.ADMIN_FRONTEND_URL}/reviews/${review._id}`,
            },
        });
    } catch (error) {
        console.error('Error notifying garage owner about review:', error);
    }
};

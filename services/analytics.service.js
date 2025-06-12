import Booking, { BOOKING_STATUS } from '../models/booking.model.js';
import Service from '../models/service.model.js';
import Garage from '../models/garage.model.js';
import mongoose from 'mongoose';

// Get booking analytics by date range
export const getBookingAnalytics = async (
    garageId = null,
    startDate = null,
    endDate = null,
) => {
    try {
        const matchQuery = {};

        if (garageId) {
            matchQuery.garageId = new mongoose.Types.ObjectId(garageId);
        }

        if (startDate || endDate) {
            matchQuery.date = {};
            if (startDate) matchQuery.date.$gte = new Date(startDate);
            if (endDate) matchQuery.date.$lte = new Date(endDate);
        }

        const bookingStats = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const totalBookings = await Booking.countDocuments(matchQuery);
        const completedBookings =
            bookingStats.find((stat) => stat._id === BOOKING_STATUS.COMPLETED)
                ?.count || 0;
        const pendingBookings =
            bookingStats.find((stat) => stat._id === BOOKING_STATUS.PENDING)
                ?.count || 0;
        const confirmedBookings =
            bookingStats.find((stat) => stat._id === BOOKING_STATUS.CONFIRMED)
                ?.count || 0;
        const cancelledBookings =
            bookingStats.find((stat) => stat._id === BOOKING_STATUS.CANCELLED)
                ?.count || 0;

        // Get daily booking stats
        const dailyBookingStats = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Get popular services
        const popularServices = await Booking.aggregate([
            { $match: matchQuery },
            { $unwind: '$serviceIds' },
            {
                $group: {
                    _id: '$serviceIds',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'service',
                },
            },
            { $unwind: '$service' },
            {
                $project: {
                    _id: 0,
                    name: '$service.name',
                    count: 1,
                },
            },
        ]);

        return {
            overview: {
                totalBookings,
                completedBookings,
                pendingBookings,
                confirmedBookings,
                cancelledBookings,
                completionRate:
                    totalBookings > 0
                        ? ((completedBookings / totalBookings) * 100).toFixed(1)
                        : 0,
                cancellationRate:
                    totalBookings > 0
                        ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
                        : 0,
            },
            dailyStats: dailyBookingStats.map((day) => ({
                date: day._id,
                bookings: day.count,
            })),
            popularServices,
        };
    } catch (error) {
        console.error('Error generating booking analytics:', error);
        throw error;
    }
};

// Get garage performance analytics
export const getGaragePerformanceAnalytics = async (garageId = null) => {
    try {
        const matchQuery = {};
        if (garageId) {
            matchQuery.garageId = new mongoose.Types.ObjectId(garageId);
        }

        // Get monthly booking data
        const monthlyBookings = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                    },
                    bookings: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    bookings: 1,
                },
            },
        ]);

        // Get top-performing garages if no garageId is provided
        let topGarages = [];
        if (!garageId) {
            topGarages = await Booking.aggregate([
                {
                    $group: {
                        _id: '$garageId',
                        bookings: { $sum: 1 },
                    },
                },
                { $sort: { bookings: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'garages',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'garage',
                    },
                },
                { $unwind: '$garage' },
                {
                    $project: {
                        _id: 0,
                        name: '$garage.name',
                        bookings: 1,
                    },
                },
            ]);
        }

        // Get service category distribution for the garage
        const serviceCategoryDistribution = await Booking.aggregate([
            { $match: matchQuery },
            { $unwind: '$serviceIds' },
            {
                $lookup: {
                    from: 'services',
                    localField: 'serviceIds',
                    foreignField: '_id',
                    as: 'service',
                },
            },
            { $unwind: '$service' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'service.category',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },
            {
                $group: {
                    _id: '$category._id',
                    name: { $first: '$category.name' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        return {
            monthlyBookings,
            topGarages,
            serviceCategoryDistribution,
        };
    } catch (error) {
        console.error('Error generating garage performance analytics:', error);
        throw error;
    }
};

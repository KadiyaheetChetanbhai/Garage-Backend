import Clinic from '../../models/clinic.model.js';
import {
    errorResponse,
    successResponse,
} from '../../helpers/general.helper.js';
import mongoose from 'mongoose';
import Service from '../../models/petService.model.js';

/**
 * Get clinics with filtering and pagination
 * This API returns a paginated list of clinics with various filter options
 */
export const getAllClinics = async (req, res) => {
    try {
        const {
            pincode,
            priceRangeStart,
            priceRangeEnd,
            services,
            date,
            rating,
            ratingSort,
            page = 1,
            limit = 10,
        } = req.query;

        // Convert page and limit to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Calculate skip value for pagination
        const skip = (pageNum - 1) * limitNum;

        // Build base filter
        const baseFilter = {};

        // Exact pincode matching
        if (pincode) {
            // Add exact pincode match to base filter
            baseFilter.pincode = pincode;
        }

        // Price range filter
        if (priceRangeStart || priceRangeEnd) {
            if (priceRangeStart) {
                baseFilter['priceRange.start'] = {
                    $gte: parseInt(priceRangeStart),
                };
            }

            if (priceRangeEnd) {
                baseFilter['priceRange.end'] = {
                    $lte: parseInt(priceRangeEnd),
                };
            }
        }

        // Initialize sort parameters
        let sortBy = 'createdAt';
        let sortOrder = -1;

        // Rating filter and sort
        if (rating) {
            const ratingNum = parseFloat(rating);
            if (!isNaN(ratingNum)) {
                baseFilter.rating = { $lte: ratingNum };
            }
        }

        if (ratingSort === 'asc' || ratingSort === 'desc') {
            // If rating sort is specified, override the default sort
            sortBy = 'rating';
            sortOrder = ratingSort === 'asc' ? 1 : -1;
        }

        // Services filter (array of service ObjectIds)
        if (services) {
            const serviceIds = Array.isArray(services)
                ? services
                : services.split(',');

            // Convert to valid ObjectIds
            const validServiceIds = serviceIds
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id));

            if (validServiceIds.length > 0) {
                baseFilter.services = { $in: validServiceIds };
            }
        }

        // Date filter - extract day from date and check if clinic is open
        if (date) {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
                // Check if date is valid
                const days = [
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                ];
                const dayName = days[dateObj.getDay()];

                baseFilter['timings'] = {
                    $elemMatch: {
                        day: dayName,
                        isClosed: false,
                    },
                };
            }
        }

        // Create a sort configuration based on the parameters
        const sortConfig = {};
        sortConfig[sortBy] = parseInt(sortOrder);

        // Count total matching clinics for pagination (with exact pincode match if provided)
        const totalClinics = await Clinic.countDocuments(baseFilter);

        // Create aggregation pipeline to fetch clinics with full URLs
        const aggregationPipeline = [];

        // Match stage: filter by base filter (which includes the exact pincode if provided)
        aggregationPipeline.push({ $match: baseFilter });
        aggregationPipeline.push({ $sort: sortConfig });
        aggregationPipeline.push({ $skip: skip });
        aggregationPipeline.push({ $limit: limitNum });

        // Lookup stages for services and doctors
        aggregationPipeline.push({
            $lookup: {
                from: 'services',
                localField: 'services',
                foreignField: '_id',
                as: 'services',
            },
        });

        aggregationPipeline.push({
            $lookup: {
                from: 'doctors',
                localField: 'doctors',
                foreignField: '_id',
                as: 'doctors',
            },
        });

        // Project stage: Add full URLs to clinic images and doctor images
        aggregationPipeline.push({
            $project: {
                _id: 1,
                clinicName: 1,
                address: 1,
                pincode: 1,
                mobileNumber: 1,
                latitude: 1,
                longitude: 1,
                mapLink: 1,
                priceRange: 1,
                rating: 1,
                website: 1,
                description: 1,
                tags: 1,
                timings: 1,
                services: {
                    $map: {
                        input: '$services',
                        as: 'service',
                        in: {
                            _id: '$$service._id',
                            serviceName: '$$service.serviceName',
                            description: '$$service.description',
                        },
                    },
                },
                doctors: {
                    $map: {
                        input: '$doctors',
                        as: 'doctor',
                        in: {
                            _id: '$$doctor._id',
                            name: '$$doctor.name',
                            image: {
                                $cond: [
                                    {
                                        $regexMatch: {
                                            input: {
                                                $ifNull: ['$$doctor.image', ''],
                                            },
                                            regex: '^http',
                                        },
                                    },
                                    '$$doctor.image',
                                    {
                                        $concat: [
                                            process.env.SERVER_URL + '',
                                            { $ifNull: ['$$doctor.image', ''] },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
                clinicImages: {
                    $map: {
                        input: { $ifNull: ['$clinicImages', []] },
                        as: 'image',
                        in: {
                            $cond: [
                                {
                                    $regexMatch: {
                                        input: { $ifNull: ['$$image', ''] },
                                        regex: '^http',
                                    },
                                },
                                '$$image',
                                {
                                    $concat: [
                                        process.env.SERVER_URL,
                                        { $ifNull: ['$$image', ''] },
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
        });

        // Execute the aggregation pipeline
        const clinicsWithFullUrls = await Clinic.aggregate(aggregationPipeline);

        // Calculate pagination information
        const totalPages = Math.ceil(totalClinics / limitNum);
        const nextPage = pageNum < totalPages ? pageNum + 1 : null;
        const previousPage = pageNum > 1 ? pageNum - 1 : null;

        return successResponse(
            res,
            {
                message: 'Clinics retrieved successfully',
                data: clinicsWithFullUrls,
                pagination: {
                    page: pageNum,
                    nextPage,
                    previousPage,
                    totalPages,
                    pageSize: limitNum,
                    totalCount: totalClinics,
                    sortOrder,
                    sortBy,
                },
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error retrieving clinics', error: error.message },
            500,
            error,
        );
    }
};

/**
 * Get clinic by ID
 * This API returns detailed information about a specific clinic
 */
export const getClinicById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, { message: 'Invalid clinic ID' }, 400);
        }

        const aggregationPipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'services',
                    localField: 'services',
                    foreignField: '_id',
                    as: 'services',
                },
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: 'doctors',
                    foreignField: '_id',
                    as: 'doctors',
                },
            },
            {
                $project: {
                    _id: 1,
                    clinicName: 1,
                    address: 1,
                    pincode: 1,
                    mobileNumber: 1,
                    latitude: 1,
                    longitude: 1,
                    mapLink: 1,
                    priceRange: 1,
                    rating: 1,
                    website: 1,
                    description: 1,
                    tags: 1,
                    timings: 1,
                    services: 1,
                    doctors: {
                        $map: {
                            input: '$doctors',
                            as: 'doctor',
                            in: {
                                _id: '$$doctor._id',
                                name: '$$doctor.name',
                                image: {
                                    $cond: [
                                        {
                                            $regexMatch: {
                                                input: {
                                                    $ifNull: [
                                                        '$$doctor.image',
                                                        '',
                                                    ],
                                                },
                                                regex: '^http',
                                            },
                                        },
                                        '$$doctor.image',
                                        {
                                            $concat: [
                                                `${process.env.SERVER_URL}`,
                                                {
                                                    $ifNull: [
                                                        '$$doctor.image',
                                                        '',
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    clinicImages: {
                        $map: {
                            input: { $ifNull: ['$clinicImages', []] },
                            as: 'image',
                            in: {
                                $cond: [
                                    {
                                        $regexMatch: {
                                            input: { $ifNull: ['$$image', ''] },
                                            regex: '^http',
                                        },
                                    },
                                    '$$image',
                                    {
                                        $concat: [
                                            `${process.env.SERVER_URL}`,
                                            { $ifNull: ['$$image', ''] },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        ];

        const clinicResults = await Clinic.aggregate(aggregationPipeline);

        if (!clinicResults || clinicResults.length === 0) {
            return errorResponse(res, { message: 'Clinic not found' }, 404);
        }

        const clinic = clinicResults[0];

        // For each parent service in the clinic, find its child services and addons
        const enrichedServices = await Promise.all(
            clinic.services.map(async (service) => {
                // Only process parent services
                if (service.isParentService) {
                    // Find child services (non-addons with this parent)
                    const childServices = await Service.find({
                        parentId: service._id,
                        isAddons: false,
                        isParentService: false,
                    }).select('_id serviceName description parentId isAddons');

                    // Find addons for this service
                    const addons = await Service.find({
                        parentId: service._id,
                        isAddons: true,
                    }).select('_id serviceName description parentId isAddons');

                    // Return service with additional data
                    return {
                        ...service,
                        childServices,
                        addons,
                    };
                }
                // Return non-parent services as is
                return service;
            }),
        );

        // Replace the original services array with the enriched one
        clinic.services = enrichedServices;

        return successResponse(
            res,
            {
                message: 'Clinic retrieved successfully',
                data: clinic,
            },
            200,
        );
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Error retrieving clinic', error: error.message },
            500,
            error,
        );
    }
};

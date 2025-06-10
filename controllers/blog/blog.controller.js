import mongoose from 'mongoose';
import {
    errorResponse,
    successResponse,
} from '../../helpers/general.helper.js';
import {
    paginationHelper,
    generateNavigations,
} from '../../helpers/pagination.helper.js';
import Blog from '../../models/blog.model.js';
import { validateSortField } from '../../helpers/general.helper.js';
import {
    createBlogSchema,
    updateBlogSchema,
} from '../../validators/blogValidators/blog.validator.js';

export const createBlog = async (req, res) => {
    try {
        // Add the current user as author if not provided
        if (!req.body.author && req.user?._id) {
            req.body.author = req.user._id;
        }

        const validatedData = await createBlogSchema.validateAsync(req.body);

        // Set publish date if status is published
        if (validatedData.status === 'published') {
            validatedData.publishedAt = new Date();
        }

        const newBlog = new Blog(validatedData);
        await newBlog.save();

        return successResponse(res, {
            message: 'Blog post created successfully',
            data: newBlog,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to create blog post', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

export const listBlogs = async (req, res) => {
    try {
        const { page, limit, skip, searchTerm, sortField, sortOrder } =
            paginationHelper(req.query);
        const allowedSortFields = [
            'title',
            'createdAt',
            'publishedAt',
            'viewCount',
        ];
        validateSortField(sortField, allowedSortFields);

        const matchConditions = [];

        // For public API, only show published blogs
        if (!req.user || req.user.userType === USER_TYPES.USER) {
            matchConditions.push({ status: 'published' });
        }

        // Filter by category if provided
        if (req.query.category) {
            matchConditions.push({ category: req.query.category });
        }

        // Filter by tag if provided
        if (req.query.tag) {
            matchConditions.push({ tags: req.query.tag });
        }

        // Filter by author if provided
        if (req.query.author) {
            if (!mongoose.Types.ObjectId.isValid(req.query.author)) {
                return errorResponse(
                    res,
                    { message: 'Invalid author ID format' },
                    422,
                );
            }
            matchConditions.push({
                author: new mongoose.Types.ObjectId(req.query.author),
            });
        }

        if (searchTerm) {
            matchConditions.push({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { content: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        const data = await Blog.aggregate([
            { $match: matchConditions.length ? { $and: matchConditions } : {} },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorDetails',
                },
            },
            {
                $unwind: {
                    path: '$authorDetails',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    content: { $substr: ['$content', 0, 200] }, // Truncated content for list
                    featuredImage: 1,
                    category: 1,
                    tags: 1,
                    status: 1,
                    slug: 1,
                    publishedAt: 1,
                    viewCount: 1,
                    createdAt: 1,
                    authorName: '$authorDetails.name',
                },
            },
            { $sort: { [sortField]: sortOrder } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const [totalData] = await Blog.aggregate([
            { $match: matchConditions.length ? { $and: matchConditions } : {} },
            { $count: 'total' },
        ]);

        const totalCount = totalData ? totalData.total : 0;
        const { totalPages, nextPage, previousPage } = generateNavigations(
            page,
            limit,
            totalCount,
        );

        return successResponse(res, {
            message: 'Blog posts retrieved successfully',
            data,
            pagination: {
                page,
                nextPage,
                previousPage,
                totalPages,
                pageSize: limit,
                totalCount,
                sortOrder,
                sortBy: sortField,
                searchTerm,
            },
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to retrieve blog posts', error: error.message },
            500,
            error,
        );
    }
};

export const getBlogDetail = async (req, res) => {
    try {
        const { slug } = req.params;

        // Find by slug
        const blog = await Blog.findOne({ slug }).populate(
            'author',
            'name email',
        );

        if (!blog) {
            return errorResponse(res, { message: 'Blog post not found' }, 404);
        }

        // Only allow access to published blogs for public users
        if (
            blog.status !== 'published' &&
            (!req.user || req.user.userType === USER_TYPES.USER)
        ) {
            return errorResponse(res, { message: 'Blog post not found' }, 404);
        }

        // Increment view count
        blog.viewCount += 1;
        await blog.save();

        return successResponse(res, {
            message: 'Blog post details retrieved successfully',
            data: blog,
        });
    } catch (error) {
        return errorResponse(
            res,
            {
                message: 'Failed to retrieve blog post details',
                error: error.message,
            },
            500,
            error,
        );
    }
};

export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid blog ID format' },
                422,
            );
        }

        const blog = await Blog.findById(id);

        if (!blog) {
            return errorResponse(res, { message: 'Blog post not found' }, 404);
        }

        const validatedData = await updateBlogSchema.validateAsync(req.body);

        // If changing status to published, set the publish date
        if (validatedData.status === 'published' && blog.status === 'draft') {
            validatedData.publishedAt = new Date();
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            { $set: validatedData },
            { new: true, runValidators: true },
        );

        return successResponse(res, {
            message: 'Blog post updated successfully',
            data: updatedBlog,
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to update blog post', error: error.message },
            error.isJoi ? 422 : 500,
            error,
        );
    }
};

export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                { message: 'Invalid blog ID format' },
                422,
            );
        }

        const blog = await Blog.findById(id);

        if (!blog) {
            return errorResponse(res, { message: 'Blog post not found' }, 404);
        }

        await Blog.deleteOne({ _id: id });

        return successResponse(res, {
            message: 'Blog post deleted successfully',
        });
    } catch (error) {
        return errorResponse(
            res,
            { message: 'Failed to delete blog post', error: error.message },
            500,
            error,
        );
    }
};

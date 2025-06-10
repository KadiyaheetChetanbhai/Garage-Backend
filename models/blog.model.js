import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        featuredImage: {
            type: String,
        },
        category: {
            type: String,
            enum: [
                'car',
                'maintenance',
                'repair',
                'tips',
                'industry',
                'general',
            ],
            default: 'general',
        },
        tags: [
            {
                type: String,
            },
        ],
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
        },
        slug: {
            type: String,
            unique: true,
            required: true,
        },
        publishedAt: {
            type: Date,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        metaTitle: {
            type: String,
        },
        metaDescription: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

// Create slug from title
blogSchema.pre('validate', function (next) {
    if (this.title && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;

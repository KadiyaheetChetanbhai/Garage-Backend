import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            default: '',
        },
        icon: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        featuredImage: {
            type: String,
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

// Create indexes for faster queries
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ isActive: 1 });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ createdAt: -1 });
categorySchema.index(
    {
        name: 'text',
        description: 'text',
        metaTitle: 'text',
        metaDescription: 'text',
    },
    {
        weights: {
            name: 10,
            description: 5,
            metaTitle: 3,
            metaDescription: 1,
        },
        name: 'category_text_index',
    },
);

const Category = mongoose.model('Category', categorySchema);
export default Category;

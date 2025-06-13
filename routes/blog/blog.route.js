import { Router } from 'express';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { USER_TYPES } from '../../constants/common.constant.js';
import {
    createBlog,
    listBlogs,
    getBlogDetail,
    updateBlog,
    deleteBlog,
} from '../../controllers/blog/blog.controller.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the blog post
 *           example: "The Benefits of Regular Vehicle Maintenance"
 *         content:
 *           type: string
 *           description: Main content of the blog post (HTML supported)
 *         author:
 *           type: string
 *           description: ID of the author (User)
 *         featuredImage:
 *           type: string
 *           description: URL to featured image
 *         category:
 *           type: string
 *           enum: [car, maintenance, repair, tips, industry, general]
 *           description: Blog category
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags for the blog post
 *         status:
 *           type: string
 *           enum: [draft, published]
 *           description: Publication status
 *         slug:
 *           type: string
 *           description: URL-friendly version of the title
 *         metaTitle:
 *           type: string
 *           description: SEO meta title
 *         metaDescription:
 *           type: string
 *           description: SEO meta description
 *       required:
 *         - title
 *         - content
 *         - author
 */

/**
 * @swagger
 * /blogs:
 *   post:
 *     summary: Create a new blog post
 *     tags:
 *       - Blog Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       200:
 *         description: Blog post created successfully
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post(
    '/',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    createBlog,
);

/**
 * @swagger
 * /blogs:
 *   get:
 *     summary: Get a paginated list of blog posts
 *     tags:
 *       - Blog Management
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page (default is 10)
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Text to search in title, content or tags
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [title, createdAt, publishedAt, viewCount]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [-1, 1]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of blog posts retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', listBlogs);

/**
 * @swagger
 * /blogs/{slug}:
 *   get:
 *     summary: Get blog post details by slug
 *     tags:
 *       - Blog Management
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         description: Slug of the blog post
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post details retrieved successfully
 *       404:
 *         description: Blog post not found
 */
router.get('/:slug', getBlogDetail);

/**
 * @swagger
 * /blogs/{id}:
 *   put:
 *     summary: Update existing blog post
 *     tags:
 *       - Blog Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               featuredImage:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [car, maintenance, repair, tips, industry, general]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *               slug:
 *                 type: string
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog post not found
 *       422:
 *         description: Invalid input
 */
router.put(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    updateBlog,
);

/**
 * @swagger
 * /blogs/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags:
 *       - Blog Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the blog post to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog post not found
 *       422:
 *         description: Invalid ID format
 */
router.delete(
    '/:id',
    authorize([USER_TYPES.SUPERADMIN, USER_TYPES.GARAGE_ADMIN]),
    deleteBlog,
);

export default router;

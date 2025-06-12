import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Create upload directory if it doesn't exist
 */
const createUploadDirectory = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
};

/**
 * Multer storage configuration with safe filename handling
 */
const storage = (module) =>
    multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = `uploads/${module}`;

            // Create directory if it doesn't exist
            createUploadDirectory(uploadPath);

            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            // Log original name for debugging

            const uniqueSuffix =
                Date.now() + '-' + Math.round(Math.random() * 1e9);
            const originalName = file.originalname || '';
            const ext = path.extname(originalName);

            // If extension is missing, default to '.jpg' or skip extension
            const safeExt = ext && ext.length <= 5 ? ext : '.jpg';

            cb(null, `${file.fieldname}-${uniqueSuffix}${safeExt}`);
        },
    });

/**
 * Image file filter to validate allowed MIME types
 */
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Invalid file type. Only JPEG, JPG, PNG, and GIF are allowed.',
            ),
            false,
        );
    }
};

/**
 * Create upload middleware with field config
 */
export const createUploadMiddleware = (module, fieldConfig) => {
    const upload = multer({
        storage: storage(module),
        fileFilter: imageFileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB per file
        },
    }).fields(fieldConfig);

    // Return middleware with error handling
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                req.multerError = err;
            }
            next();
        });
    };
};

/**
 * Format uploaded files for DB storage
 */
export const processUploadedFiles = (files) => {
    const results = {};

    if (!files) return results;

    Object.keys(files).forEach((fieldName) => {
        if (files[fieldName] && files[fieldName].length > 0) {
            results[fieldName] = files[fieldName].map((file) => ({
                url: file.path.replace(/\\/g, '/'), // Normalize Windows paths
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
            }));
        }
    });

    return results;
};

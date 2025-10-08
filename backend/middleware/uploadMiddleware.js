const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const idImagesDir = path.join(uploadsDir, 'id-images');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(idImagesDir)) {
    fs.mkdirSync(idImagesDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, idImagesDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `fb-id-${uniqueSuffix}-${originalName}`);
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file at a time
    }
});

// Middleware for single file upload
const uploadIdImage = upload.single('id_image');

// Error handling middleware for multer errors
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Only one file is allowed.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field. Use "id_image" field name.'
            });
        }
    }
    
    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({
            success: false,
            message: 'Only image files are allowed (jpg, jpeg, png, gif, webp).'
        });
    }
    
    next(error);
};

// Utility function to delete uploaded file
const deleteUploadedFile = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted uploaded file:', filePath);
        }
    } catch (error) {
        console.error('Error deleting uploaded file:', error);
    }
};

// Get relative path for database storage
const getRelativeImagePath = (filename) => {
    return `/uploads/id-images/${filename}`;
};

// Get absolute path from relative path
const getAbsoluteImagePath = (relativePath) => {
    if (!relativePath) return null;
    return path.join(__dirname, '../uploads', relativePath.replace('/uploads/', ''));
};

module.exports = {
    uploadIdImage,
    handleUploadError,
    deleteUploadedFile,
    getRelativeImagePath,
    getAbsoluteImagePath
};
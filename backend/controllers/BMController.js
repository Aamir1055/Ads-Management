const BMModel = require('../models/BMModel');
const { body, validationResult, param } = require('express-validator');

class BMController {
    // Get all BMs (filtered by user)
    static async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                status = '',
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = req.query;

            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';

            // Debug logging
            console.log('🔍 BM getAll called with params:', {
                page, limit, search, status, sortBy, sortOrder, userId, userRole
            });

            const result = await BMModel.getAll({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status,
                sortBy,
                sortOrder: sortOrder.toUpperCase(),
                userId,
                userRole
            });

            return res.status(200).json({
                success: true,
                message: 'BMs retrieved successfully',
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error in BMController.getAll:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Get BM by ID
    static async getById(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid BM ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';

            const bm = await BMModel.getById(parseInt(id), userId, userRole);

            if (!bm) {
                return res.status(404).json({
                    success: false,
                    message: 'BM not found or you do not have permission to access it',
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(200).json({
                success: true,
                message: 'BM retrieved successfully',
                data: bm
            });
        } catch (error) {
            console.error('Error in BMController.getById:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Create new BM
    static async create(req, res) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    timestamp: new Date().toISOString()
                });
            }

            const { bm_name, email, phone_number, status = 'enabled' } = req.body;
            const created_by = req.user?.id || null;

            const newBM = await BMModel.create({
                bm_name,
                email,
                phone_number,
                status,
                created_by
            });

            return res.status(201).json({
                success: true,
                message: 'BM created successfully',
                data: newBM
            });
        } catch (error) {
            console.error('Error in BMController.create:', error);

            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Update BM
    static async update(req, res) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    timestamp: new Date().toISOString()
                });
            }

            const { id } = req.params;
            const { bm_name, email, phone_number, status } = req.body;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid BM ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            const updatedBM = await BMModel.update(parseInt(id), {
                bm_name,
                email,
                phone_number,
                status
            });

            return res.status(200).json({
                success: true,
                message: 'BM updated successfully',
                data: updatedBM
            });
        } catch (error) {
            console.error('Error in BMController.update:', error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Delete BM
    static async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid BM ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            const deleted = await BMModel.delete(parseInt(id));

            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete BM',
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(200).json({
                success: true,
                message: 'BM deleted successfully'
            });
        } catch (error) {
            console.error('Error in BMController.delete:', error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Toggle BM status
    static async toggleStatus(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid BM ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            const updatedBM = await BMModel.toggleStatus(parseInt(id));

            return res.status(200).json({
                success: true,
                message: `BM status changed to ${updatedBM.status}`,
                data: updatedBM
            });
        } catch (error) {
            console.error('Error in BMController.toggleStatus:', error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Get BM stats
    static async getStats(req, res) {
        try {
            const stats = await BMModel.getStats();

            return res.status(200).json({
                success: true,
                message: 'BM stats retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error in BMController.getStats:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Get BMs for dropdown
    static async getForDropdown(req, res) {
        try {
            const bms = await BMModel.getForDropdown();

            return res.status(200).json({
                success: true,
                message: 'BMs for dropdown retrieved successfully',
                data: bms
            });
        } catch (error) {
            console.error('Error in BMController.getForDropdown:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Validation rules
    static getValidationRules() {
        return {
            create: [
                body('bm_name')
                    .trim()
                    .notEmpty()
                    .withMessage('BM name is required')
                    .isLength({ min: 2, max: 255 })
                    .withMessage('BM name must be between 2 and 255 characters'),
                
                body('email')
                    .trim()
                    .notEmpty()
                    .withMessage('Email is required')
                    .isEmail()
                    .withMessage('Please provide a valid email address')
                    .normalizeEmail(),

                body('phone_number')
                    .optional()
                    .trim()
                    .isLength({ max: 50 })
                    .withMessage('Phone number must be less than 50 characters'),

                body('status')
                    .optional()
                    .isIn(['enabled', 'disabled', 'suspended_temporarily'])
                    .withMessage('Status must be enabled, disabled, or suspended_temporarily')
            ],

            update: [
                param('id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid BM ID'),

                body('bm_name')
                    .trim()
                    .notEmpty()
                    .withMessage('BM name is required')
                    .isLength({ min: 2, max: 255 })
                    .withMessage('BM name must be between 2 and 255 characters'),
                
                body('email')
                    .trim()
                    .notEmpty()
                    .withMessage('Email is required')
                    .isEmail()
                    .withMessage('Please provide a valid email address')
                    .normalizeEmail(),

                body('phone_number')
                    .optional()
                    .trim()
                    .isLength({ max: 50 })
                    .withMessage('Phone number must be less than 50 characters'),

                body('status')
                    .notEmpty()
                    .withMessage('Status is required')
                    .isIn(['enabled', 'disabled', 'suspended_temporarily'])
                    .withMessage('Status must be enabled, disabled, or suspended_temporarily')
            ],

            getById: [
                param('id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid BM ID')
            ],

            delete: [
                param('id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid BM ID')
            ],

            toggleStatus: [
                param('id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid BM ID')
            ]
        };
    }
}

module.exports = BMController;
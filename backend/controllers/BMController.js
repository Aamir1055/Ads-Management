const BMModel = require('../models/BMModel');
const { body, param, validationResult } = require('express-validator');

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
                console.log('❌ Validation errors:', errors.array());
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    timestamp: new Date().toISOString()
                });
            }

            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';

            // Extract validated data
            const { 
                bm_name,
                email,
                phone_number,
                status = 'enabled'
            } = req.body;

            const newBM = await BMModel.create({
                bm_name,
                email,
                phone_number,
                status,
                created_by: userId
            });

            return res.status(201).json({
                success: true,
                message: 'Business Manager created successfully',
                data: newBM
            });
        } catch (error) {
            console.error('Error in BMController.create:', error);

            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred while creating the Business Manager',
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
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Business Manager ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';

            // Extract validated data
            const { 
                bm_name, 
                account_name, 
                facebook_account_id, 
                email, 
                phone_number, 
                status 
            } = req.body;

            // Check if user has permission to update this BM
            const bm = await BMModel.getById(parseInt(id), userId, userRole);
            if (!bm) {
                return res.status(404).json({
                    success: false,
                    message: 'Business Manager not found or access denied',
                    timestamp: new Date().toISOString()
                });
            }

            const updatedBM = await BMModel.update(parseInt(id), {
                bm_name,
                account_name,
                facebook_account_id,
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

    // Get BMs for dropdown (filtered by user)
    static async getForDropdown(req, res) {
        try {
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const bms = await BMModel.getForDropdown(userId, userRole);

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

    // Validation rules for create and update operations
    static getValidationRules() {
        return [
            body('bm_name')
                .trim()
                .notEmpty()
                .withMessage('Business Manager name is required')
                .isLength({ min: 2, max: 255 })
                .withMessage('Business Manager name must be between 2 and 255 characters'),
            body('email')
                .trim()
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Please provide a valid email address')
                .normalizeEmail(),
            body('phone_number')
                .optional()
                .custom((value) => {
                    // Allow empty or null values since field is optional
                    if (!value || value.trim() === '') {
                        return true;
                    }
                    // Validate format only if value is provided
                    return /^\+?[1-9]\d{1,14}$/.test(value.trim());
                })
                .withMessage('Please provide a valid phone number or leave it empty'),
            body('status')
                .optional()
                .isIn(['enabled', 'disabled'])
                .withMessage('Status must be either enabled or disabled')
        ];
    }
}

module.exports = BMController;
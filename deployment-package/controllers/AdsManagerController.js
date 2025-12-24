const AdsManagerModel = require('../models/AdsManagerModel');
const { body, validationResult, param } = require('express-validator');

class AdsManagerController {
    // Get all Ads Managers (filtered by user)
    static async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                status = '',
                bm_id = '',
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = req.query;

            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';

            const result = await AdsManagerModel.getAll({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status,
                bm_id: bm_id ? parseInt(bm_id) : '',
                sortBy,
                sortOrder: sortOrder.toUpperCase(),
                userId,
                userRole
            });

            return res.status(200).json({
                success: true,
                message: 'Ads Managers retrieved successfully',
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error in AdsManagerController.getAll:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Get Ads Manager by ID
    static async getById(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Ads Manager ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            const adsManager = await AdsManagerModel.getById(parseInt(id));

            if (!adsManager) {
                return res.status(404).json({
                    success: false,
                    message: 'Ads Manager not found',
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Ads Manager retrieved successfully',
                data: adsManager
            });
        } catch (error) {
            console.error('Error in AdsManagerController.getById:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Get Ads Managers by BM ID
    static async getByBMId(req, res) {
        try {
            const { bm_id } = req.params;

            if (!bm_id || isNaN(parseInt(bm_id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid BM ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            const adsManagers = await AdsManagerModel.getByBMId(parseInt(bm_id));

            return res.status(200).json({
                success: true,
                message: 'Ads Managers for BM retrieved successfully',
                data: adsManagers
            });
        } catch (error) {
            console.error('Error in AdsManagerController.getByBMId:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Create new Ads Manager
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

            const { bm_id, ads_manager_name, email = null, phone_number = null, status = 'enabled' } = req.body;
            const created_by = req.user?.id || null;

            const newAdsManager = await AdsManagerModel.create({
                bm_id,
                ads_manager_name,
                email,
                phone_number,
                status,
                created_by
            });

            return res.status(201).json({
                success: true,
                message: 'Ads Manager created successfully',
                data: newAdsManager
            });
        } catch (error) {
            console.error('Error in AdsManagerController.create:', error);

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

    // Update Ads Manager
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
            const { bm_id, ads_manager_name, email = null, phone_number = null, status } = req.body;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Ads Manager ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            const updatedAdsManager = await AdsManagerModel.update(parseInt(id), {
                bm_id,
                ads_manager_name,
                email,
                phone_number,
                status
            });

            return res.status(200).json({
                success: true,
                message: 'Ads Manager updated successfully',
                data: updatedAdsManager
            });
        } catch (error) {
            console.error('Error in AdsManagerController.update:', error);

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

    // Delete Ads Manager
    static async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Ads Manager ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            const deleted = await AdsManagerModel.delete(parseInt(id));

            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete Ads Manager',
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Ads Manager deleted successfully'
            });
        } catch (error) {
            console.error('Error in AdsManagerController.delete:', error);

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

    // Toggle Ads Manager status
    static async toggleStatus(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Ads Manager ID provided',
                    timestamp: new Date().toISOString()
                });
            }

            const updatedAdsManager = await AdsManagerModel.toggleStatus(parseInt(id));

            return res.status(200).json({
                success: true,
                message: `Ads Manager status changed to ${updatedAdsManager.status}`,
                data: updatedAdsManager
            });
        } catch (error) {
            console.error('Error in AdsManagerController.toggleStatus:', error);

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

    // Get Ads Manager stats
    static async getStats(req, res) {
        try {
            const stats = await AdsManagerModel.getStats();

            return res.status(200).json({
                success: true,
                message: 'Ads Manager stats retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error in AdsManagerController.getStats:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Get stats by BM
    static async getStatsByBM(req, res) {
        try {
            const stats = await AdsManagerModel.getStatsByBM();

            return res.status(200).json({
                success: true,
                message: 'Ads Manager stats by BM retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error in AdsManagerController.getStatsByBM:', error);
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
                body('bm_id')
                    .notEmpty()
                    .withMessage('BM ID is required')
                    .isInt({ min: 1 })
                    .withMessage('BM ID must be a valid integer'),

                body('ads_manager_name')
                    .trim()
                    .notEmpty()
                    .withMessage('Ads Manager name is required')
                    .isLength({ min: 2, max: 255 })
                    .withMessage('Ads Manager name must be between 2 and 255 characters'),

                body('status')
                    .optional()
                    .isIn(['enabled', 'disabled', 'suspended_temporarily'])
                    .withMessage('Status must be enabled, disabled, or suspended_temporarily')
            ],

            update: [
                param('id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid Ads Manager ID'),

                body('bm_id')
                    .notEmpty()
                    .withMessage('BM ID is required')
                    .isInt({ min: 1 })
                    .withMessage('BM ID must be a valid integer'),

                body('ads_manager_name')
                    .trim()
                    .notEmpty()
                    .withMessage('Ads Manager name is required')
                    .isLength({ min: 2, max: 255 })
                    .withMessage('Ads Manager name must be between 2 and 255 characters'),

                body('status')
                    .notEmpty()
                    .withMessage('Status is required')
                    .isIn(['enabled', 'disabled', 'suspended_temporarily'])
                    .withMessage('Status must be enabled, disabled, or suspended_temporarily')
            ],

            getById: [
                param('id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid Ads Manager ID')
            ],

            getByBMId: [
                param('bm_id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid BM ID')
            ],

            delete: [
                param('id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid Ads Manager ID')
            ],

            toggleStatus: [
                param('id')
                    .isInt({ min: 1 })
                    .withMessage('Invalid Ads Manager ID')
            ]
        };
    }
}

module.exports = AdsManagerController;
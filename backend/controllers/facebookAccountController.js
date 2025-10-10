const FacebookAccountModel = require('../models/facebookAccountModel');
const { getRelativeImagePath, deleteUploadedFile, getAbsoluteImagePath } = require('../middleware/uploadMiddleware');
const { validationResult } = require('express-validator');

class FacebookAccountController {
    
    // Get all Facebook accounts (filtered by user)
    static async getAllAccounts(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                search
            } = req.query;
            
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const result = await FacebookAccountModel.getAll(
                parseInt(page),
                parseInt(limit),
                status,
                search,
                userId,
                userRole
            );
            
            res.status(200).json({
                success: true,
                message: 'Facebook accounts retrieved successfully',
                data: result.accounts,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error in getAllAccounts:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook accounts'
            });
        }
    }
    
    // Get Facebook account by ID
    static async getAccountById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid account ID is required'
                });
            }
            
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const account = await FacebookAccountModel.getById(parseInt(id), userId, userRole);
            
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Facebook account not found or you do not have permission to access it'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Facebook account retrieved successfully',
                data: account
            });
        } catch (error) {
            console.error('Error in getAccountById:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook account'
            });
        }
    }
    
    // Create new Facebook account
    static async createAccount(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Delete uploaded file if validation fails
                if (req.file) {
                    deleteUploadedFile(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            
            const { email, password, authenticator, phone_number, status } = req.body;
            
            // Check if email already exists
            const emailExists = await FacebookAccountModel.emailExists(email);
            if (emailExists) {
                // Delete uploaded file if email exists
                if (req.file) {
                    deleteUploadedFile(req.file.path);
                }
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            
            // Prepare account data
            const accountData = {
                email,
                password,
                authenticator: authenticator || null,
                phone_number: phone_number || null,
                id_image_path: req.file ? getRelativeImagePath(req.file.filename) : null,
                status: status || 'enabled'
            };
            
            const createdAccount = await FacebookAccountModel.create(accountData, req.user.id);
            
            res.status(201).json({
                success: true,
                message: 'Facebook account created successfully',
                data: createdAccount
            });
        } catch (error) {
            // Delete uploaded file if account creation fails
            if (req.file) {
                deleteUploadedFile(req.file.path);
            }
            
            console.error('Error in createAccount:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create Facebook account'
            });
        }
    }
    
    // Update Facebook account
    static async updateAccount(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Delete uploaded file if validation fails
                if (req.file) {
                    deleteUploadedFile(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            
            const { id } = req.params;
            const { email, password, authenticator, phone_number, status } = req.body;
            
            if (!id || isNaN(id)) {
                if (req.file) {
                    deleteUploadedFile(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Valid account ID is required'
                });
            }
            
            // Check if account exists and user has permission to update it
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const existingAccount = await FacebookAccountModel.getById(parseInt(id), userId, userRole);
            if (!existingAccount) {
                if (req.file) {
                    deleteUploadedFile(req.file.path);
                }
                return res.status(404).json({
                    success: false,
                    message: 'Facebook account not found or you do not have permission to update it'
                });
            }
            
            // Check if email already exists (excluding current account)
            if (email && email !== existingAccount.email) {
                const emailExists = await FacebookAccountModel.emailExists(email, parseInt(id));
                if (emailExists) {
                    if (req.file) {
                        deleteUploadedFile(req.file.path);
                    }
                    return res.status(409).json({
                        success: false,
                        message: 'Email already exists'
                    });
                }
            }
            
            // Prepare update data
            const updateData = {
                email,
                password,
                authenticator,
                phone_number,
                status
            };
            
            // Handle image upload
            if (req.file) {
                // Delete old image if exists
                if (existingAccount.id_image_path) {
                    const oldImagePath = getAbsoluteImagePath(existingAccount.id_image_path);
                    deleteUploadedFile(oldImagePath);
                }
                updateData.id_image_path = getRelativeImagePath(req.file.filename);
            }
            
            const updatedAccount = await FacebookAccountModel.update(parseInt(id), updateData, req.user.id);
            
            res.status(200).json({
                success: true,
                message: 'Facebook account updated successfully',
                data: updatedAccount
            });
        } catch (error) {
            // Delete uploaded file if update fails
            if (req.file) {
                deleteUploadedFile(req.file.path);
            }
            
            console.error('Error in updateAccount:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update Facebook account'
            });
        }
    }
    
    // Delete Facebook account
    static async deleteAccount(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid account ID is required'
                });
            }
            
            // Check if account exists and user has permission to delete it
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const existingAccount = await FacebookAccountModel.getById(parseInt(id), userId, userRole);
            if (!existingAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Facebook account not found or you do not have permission to delete it'
                });
            }
            
            const deleted = await FacebookAccountModel.delete(parseInt(id));
            
            if (deleted) {
                // Delete associated image file
                if (existingAccount.id_image_path) {
                    const imagePath = getAbsoluteImagePath(existingAccount.id_image_path);
                    deleteUploadedFile(imagePath);
                }
                
                res.status(200).json({
                    success: true,
                    message: 'Facebook account deleted successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Facebook account not found'
                });
            }
        } catch (error) {
            console.error('Error in deleteAccount:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete Facebook account'
            });
        }
    }
    
    // Get accounts by status (filtered by user)
    static async getAccountsByStatus(req, res) {
        try {
            const { status } = req.params;
            
            if (!status || !['enabled', 'disabled', 'suspended_temporarily'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid status is required (enabled, disabled, or suspended_temporarily)'
                });
            }
            
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const accounts = await FacebookAccountModel.getByStatus(status, userId, userRole);
            
            res.status(200).json({
                success: true,
                message: `${status} Facebook accounts retrieved successfully`,
                data: accounts,
                count: accounts.length
            });
        } catch (error) {
            console.error('Error in getAccountsByStatus:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook accounts by status'
            });
        }
    }
    
    // Toggle account status
    static async toggleAccountStatus(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid account ID is required'
                });
            }
            
            // Check if account exists and user has permission to toggle it
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const existingAccount = await FacebookAccountModel.getById(parseInt(id), userId, userRole);
            if (!existingAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Facebook account not found or you do not have permission to modify it'
                });
            }
            
            const newStatus = existingAccount.status === 'enabled' ? 'disabled' : 'enabled';
            
            const updatedAccount = await FacebookAccountModel.update(
                parseInt(id),
                { status: newStatus },
                req.user.id
            );
            
            res.status(200).json({
                success: true,
                message: `Facebook account ${newStatus} successfully`,
                data: updatedAccount
            });
        } catch (error) {
            console.error('Error in toggleAccountStatus:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to toggle Facebook account status'
            });
        }
    }
    
    // Get account statistics (filtered by user)
    static async getAccountStats(req, res) {
        try {
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const [enabledAccounts, disabledAccounts, suspendedAccounts] = await Promise.all([
                FacebookAccountModel.getByStatus('enabled', userId, userRole),
                FacebookAccountModel.getByStatus('disabled', userId, userRole),
                FacebookAccountModel.getByStatus('suspended_temporarily', userId, userRole)
            ]);
            
            const totalAccounts = enabledAccounts.length + disabledAccounts.length + suspendedAccounts.length;
            
            const stats = {
                total: totalAccounts,
                enabled: enabledAccounts.length,
                disabled: disabledAccounts.length,
                suspended_temporarily: suspendedAccounts.length,
                enabledPercentage: totalAccounts > 0 ? 
                    Math.round((enabledAccounts.length / totalAccounts) * 100) : 0
            };
            
            res.status(200).json({
                success: true,
                message: 'Facebook account statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error in getAccountStats:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook account statistics'
            });
        }
    }
}

module.exports = FacebookAccountController;

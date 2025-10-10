const FacebookPageModel = require('../models/facebookPageModel');
const FacebookAccountModel = require('../models/facebookAccountModel');
const { validationResult } = require('express-validator');

class FacebookPageController {
    
    // Get all Facebook pages
    static async getAllPages(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                search,
                accountId
            } = req.query;
            
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const result = await FacebookPageModel.getAll(
                parseInt(page),
                parseInt(limit),
                status,
                search,
                accountId ? parseInt(accountId) : null,
                userId,
                userRole
            );
            
            res.status(200).json({
                success: true,
                message: 'Facebook pages retrieved successfully',
                data: result.pages,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error in getAllPages:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook pages'
            });
        }
    }
    
    // Get Facebook page by ID
    static async getPageById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid page ID is required'
                });
            }
            
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const page = await FacebookPageModel.getById(parseInt(id), userId, userRole);
            
            if (!page) {
                return res.status(404).json({
                    success: false,
                    message: 'Facebook page not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Facebook page retrieved successfully',
                data: page
            });
        } catch (error) {
            console.error('Error in getPageById:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook page'
            });
        }
    }
    
    // Create new Facebook page
    static async createPage(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            
            const { facebook_account_id, page_name, page_description, status } = req.body;
            
            // Check if page name already exists for this account
            const pageExists = await FacebookPageModel.pageNameExists(facebook_account_id, page_name);
            if (pageExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Page name already exists for this Facebook account'
                });
            }
            
            // Prepare page data
            const pageData = {
                facebook_account_id,
                page_name,
                page_description: page_description || null,
                status: status || 'enabled'
            };
            
            const createdPage = await FacebookPageModel.create(pageData, req.user.id);
            
            res.status(201).json({
                success: true,
                message: 'Facebook page created successfully',
                data: createdPage
            });
        } catch (error) {
            console.error('Error in createPage:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create Facebook page'
            });
        }
    }
    
    // Update Facebook page
    static async updatePage(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            
            const { id } = req.params;
            const { facebook_account_id, page_name, page_description, status } = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid page ID is required'
                });
            }
            
            // Check if page exists and user has permission to update it
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const existingPage = await FacebookPageModel.getById(parseInt(id), userId, userRole);
            if (!existingPage) {
                return res.status(404).json({
                    success: false,
                    message: 'Facebook page not found or you do not have permission to update it'
                });
            }
            
            // Check if page name already exists for this account (excluding current page)
            if (page_name && facebook_account_id) {
                const pageExists = await FacebookPageModel.pageNameExists(facebook_account_id, page_name, parseInt(id));
                if (pageExists) {
                    return res.status(409).json({
                        success: false,
                        message: 'Page name already exists for this Facebook account'
                    });
                }
            }
            
            // Prepare update data
            const updateData = {
                facebook_account_id,
                page_name,
                page_description,
                status
            };
            
            const updatedPage = await FacebookPageModel.update(parseInt(id), updateData, req.user.id);
            
            res.status(200).json({
                success: true,
                message: 'Facebook page updated successfully',
                data: updatedPage
            });
        } catch (error) {
            console.error('Error in updatePage:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update Facebook page'
            });
        }
    }
    
    // Delete Facebook page
    static async deletePage(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid page ID is required'
                });
            }
            
            // Check if page exists and user has permission to delete it
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const existingPage = await FacebookPageModel.getById(parseInt(id), userId, userRole);
            if (!existingPage) {
                return res.status(404).json({
                    success: false,
                    message: 'Facebook page not found or you do not have permission to delete it'
                });
            }
            
            const deleted = await FacebookPageModel.delete(parseInt(id));
            
            if (deleted) {
                res.status(200).json({
                    success: true,
                    message: 'Facebook page deleted successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Facebook page not found'
                });
            }
        } catch (error) {
            console.error('Error in deletePage:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete Facebook page'
            });
        }
    }
    
    // Get pages by status
    static async getPagesByStatus(req, res) {
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
            
            const pages = await FacebookPageModel.getByStatus(status, userId, userRole);
            
            res.status(200).json({
                success: true,
                message: `${status} Facebook pages retrieved successfully`,
                data: pages,
                count: pages.length
            });
        } catch (error) {
            console.error('Error in getPagesByStatus:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook pages by status'
            });
        }
    }
    
    // Get pages by Facebook account ID
    static async getPagesByAccountId(req, res) {
        try {
            const { accountId } = req.params;
            
            if (!accountId || isNaN(accountId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid Facebook account ID is required'
                });
            }
            
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const pages = await FacebookPageModel.getByAccountId(parseInt(accountId), userId, userRole);
            
            res.status(200).json({
                success: true,
                message: 'Facebook pages retrieved successfully',
                data: pages,
                count: pages.length
            });
        } catch (error) {
            console.error('Error in getPagesByAccountId:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook pages by account ID'
            });
        }
    }
    
    // Toggle page status
    static async togglePageStatus(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid page ID is required'
                });
            }
            
            // Check if page exists and user has permission to modify it
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            const existingPage = await FacebookPageModel.getById(parseInt(id), userId, userRole);
            if (!existingPage) {
                return res.status(404).json({
                    success: false,
                    message: 'Facebook page not found or you do not have permission to modify it'
                });
            }
            
            // Simple toggle between enabled and disabled
            const newStatus = existingPage.status === 'enabled' ? 'disabled' : 'enabled';
            
            const updatedPage = await FacebookPageModel.update(
                parseInt(id),
                { status: newStatus },
                req.user.id
            );
            
            res.status(200).json({
                success: true,
                message: `Facebook page ${newStatus} successfully`,
                data: updatedPage
            });
        } catch (error) {
            console.error('Error in togglePageStatus:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to toggle Facebook page status'
            });
        }
    }
    
    // Get page statistics
    static async getPageStats(req, res) {
        try {
            const stats = await FacebookPageModel.getStats();
            
            res.status(200).json({
                success: true,
                message: 'Facebook page statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error in getPageStats:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook page statistics'
            });
        }
    }
    
    // Get Facebook accounts for dropdown (filtered by user)
    static async getFacebookAccountsForDropdown(req, res) {
        try {
            // Get user info from auth middleware
            const userId = req.user.id;
            const userRole = req.user.role?.name || 'user';
            
            // Get only enabled Facebook accounts for the dropdown (filtered by user)
            const enabledAccounts = await FacebookAccountModel.getByStatus('enabled', userId, userRole);
            
            // Format for dropdown
            const accountOptions = enabledAccounts.map(account => ({
                id: account.id,
                email: account.email,
                status: account.status
            }));
            
            res.status(200).json({
                success: true,
                message: 'Facebook accounts retrieved successfully',
                data: accountOptions
            });
        } catch (error) {
            console.error('Error in getFacebookAccountsForDropdown:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve Facebook accounts'
            });
        }
    }
}

module.exports = FacebookPageController;
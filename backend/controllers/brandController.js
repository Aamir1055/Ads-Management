const Brand = require('../models/Brand');

class BrandController {
  // GET /api/brands - Get all brands (accessible to authenticated users)
  static async getAllBrands(req, res) {
    try {
      console.log('🏷️ BrandController.getAllBrands - User:', req.user?.id);
      
      const { search, active } = req.query;
      
      const filters = {};
      
      // Parse active filter
      if (active === 'true') {
        filters.isActive = true;
      } else if (active === 'false') {
        filters.isActive = false;
      }
      
      // Add search filter
      if (search && search.trim()) {
        filters.search = search.trim();
      }

      console.log('🏷️ Applied filters:', filters);

      const brands = await Brand.findAll(filters);

      console.log(`🏷️ Found ${brands.length} brands`);

      return res.status(200).json({
        success: true,
        data: brands,
        message: brands.length === 0 ? 'No brands found' : `Found ${brands.length} brands`
      });
    } catch (error) {
      console.error('❌ Error in BrandController.getAllBrands:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch brands',
        error: error.message
      });
    }
  }

  // GET /api/brands/active - Get only active brands (for dropdowns)
  static async getActiveBrands(req, res) {
    try {
      console.log('🏷️ BrandController.getActiveBrands - User:', req.user?.id);

      const brands = await Brand.getForDropdown();

      console.log(`🏷️ Found ${brands.length} active brands`);

      return res.status(200).json({
        success: true,
        data: brands,
        message: `Found ${brands.length} active brands`
      });
    } catch (error) {
      console.error('❌ Error in BrandController.getActiveBrands:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch active brands',
        error: error.message
      });
    }
  }

  // GET /api/brands/:id - Get single brand
  static async getBrandById(req, res) {
    try {
      console.log('🏷️ BrandController.getBrandById - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand ID'
        });
      }

      const brand = await Brand.findById(parseInt(id));

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      console.log(`🏷️ Found brand: ${brand.name}`);

      return res.status(200).json({
        success: true,
        data: brand,
        message: 'Brand retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error in BrandController.getBrandById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch brand',
        error: error.message
      });
    }
  }

  // POST /api/brands - Create new brand (SuperAdmin only)
  static async createBrand(req, res) {
    try {
      console.log('🏷️ BrandController.createBrand - User:', req.user?.id);
      
      const { name, description, is_active } = req.body;
      const userId = req.user?.id;

      // Validation
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Brand name is required'
        });
      }

      // Check if name already exists
      const nameValid = await Brand.validateName(name.trim());
      if (!nameValid) {
        return res.status(400).json({
          success: false,
          message: 'A brand with this name already exists'
        });
      }

      const brandData = {
        name: name.trim(),
        description: description?.trim() || null,
        is_active: is_active !== undefined ? is_active : true,
        created_by: userId
      };

      console.log('🏷️ Creating brand with data:', brandData);

      const brand = await Brand.create(brandData);

      console.log(`✅ Created brand: ${brand.name}`);

      return res.status(201).json({
        success: true,
        data: brand,
        message: 'Brand created successfully'
      });
    } catch (error) {
      console.error('❌ Error in BrandController.createBrand:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create brand',
        error: error.message
      });
    }
  }

  // PUT /api/brands/:id - Update brand (SuperAdmin only)
  static async updateBrand(req, res) {
    try {
      console.log('🏷️ BrandController.updateBrand - User:', req.user?.id);
      
      const { id } = req.params;
      const { name, description, is_active } = req.body;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand ID'
        });
      }

      // Check if brand exists
      const existingBrand = await Brand.findById(parseInt(id));
      if (!existingBrand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      // Validation
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Brand name is required'
        });
      }

      // Check if name already exists (excluding current brand)
      const nameValid = await Brand.validateName(name.trim(), parseInt(id));
      if (!nameValid) {
        return res.status(400).json({
          success: false,
          message: 'A brand with this name already exists'
        });
      }

      const brandData = {
        name: name.trim(),
        description: description?.trim() || null,
        is_active: is_active !== undefined ? is_active : existingBrand.is_active,
        updated_by: userId
      };

      console.log('🏷️ Updating brand with data:', brandData);

      const brand = await Brand.update(parseInt(id), brandData);

      console.log(`✅ Updated brand: ${brand.name}`);

      return res.status(200).json({
        success: true,
        data: brand,
        message: 'Brand updated successfully'
      });
    } catch (error) {
      console.error('❌ Error in BrandController.updateBrand:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update brand',
        error: error.message
      });
    }
  }

  // DELETE /api/brands/:id - Delete brand (SuperAdmin only)
  static async deleteBrand(req, res) {
    try {
      console.log('🏷️ BrandController.deleteBrand - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand ID'
        });
      }

      // Check if brand exists
      const existingBrand = await Brand.findById(parseInt(id));
      if (!existingBrand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      console.log(`🏷️ Deleting brand: ${existingBrand.name}`);

      await Brand.delete(parseInt(id));

      console.log(`✅ Deleted brand: ${existingBrand.name}`);

      return res.status(200).json({
        success: true,
        message: 'Brand deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error in BrandController.deleteBrand:', error);
      
      if (error.message.includes('Cannot delete brand that is being used')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          details: 'Remove the brand from all campaigns before deleting it.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to delete brand',
        error: error.message
      });
    }
  }

  // PUT /api/brands/:id/toggle - Toggle brand active status (SuperAdmin only)
  static async toggleBrandStatus(req, res) {
    try {
      console.log('🏷️ BrandController.toggleBrandStatus - User:', req.user?.id);
      
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand ID'
        });
      }

      console.log(`🏷️ Toggling status for brand ID: ${id}`);

      const brand = await Brand.toggleActive(parseInt(id), userId);

      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      console.log(`✅ Toggled brand status: ${brand.name} -> ${brand.is_active ? 'Active' : 'Inactive'}`);

      return res.status(200).json({
        success: true,
        data: brand,
        message: `Brand ${brand.is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('❌ Error in BrandController.toggleBrandStatus:', error);

      if (error.message === 'Brand not found') {
        return res.status(404).json({
          success: false,
          message: 'Brand not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to toggle brand status',
        error: error.message
      });
    }
  }

  // GET /api/brands/admin/stats - Get brand statistics (SuperAdmin only)
  static async getBrandStats(req, res) {
    try {
      console.log('🏷️ BrandController.getBrandStats - User:', req.user?.id);

      const stats = await Brand.getStats();

      console.log('🏷️ Brand stats:', stats);

      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Brand statistics retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error in BrandController.getBrandStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch brand statistics',
        error: error.message
      });
    }
  }
}

module.exports = BrandController;

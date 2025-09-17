import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  IconButton,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon
} from '@mui/icons-material';

const BrandForm = ({
  open = false,
  onClose,
  onSave,
  brand = null,
  loading = false,
  permissions = {}
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEditMode = Boolean(brand?.id);

  // Initialize form data when brand changes
  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        description: brand.description || '',
        is_active: brand.is_active !== undefined ? brand.is_active : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
    setErrors({});
    setTouched({});
  }, [brand]);

  // Validation function
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'Brand name is required';
        }
        if (value.trim().length < 2) {
          return 'Brand name must be at least 2 characters';
        }
        if (value.trim().length > 255) {
          return 'Brand name must be less than 255 characters';
        }
        return null;
      
      case 'description':
        if (value && value.length > 1000) {
          return 'Description must be less than 1000 characters';
        }
        return null;
      
      default:
        return null;
    }
  };

  // Handle input changes
  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Validate field on change if it has been touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      if (error) {
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }
    }
  };

  // Handle field blur
  const handleBlur = (event) => {
    const { name, value } = event.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      description: true
    });

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || null
    };

    onSave(submitData);
  };

  // Handle form reset/close
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
    setErrors({});
    setTouched({});
    onClose();
  };

  // Check if user can create/update - also allow if onSave function is provided
  const canSave = onSave && (isEditMode 
    ? (permissions.brands_update || permissions.brands_create)
    : permissions.brands_create);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="brand-form-title"
    >
      <DialogTitle
        id="brand-form-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {isEditMode ? (
            <>
              <SaveIcon color="primary" />
              <Typography variant="h6">Edit Brand</Typography>
            </>
          ) : (
            <>
              <AddIcon color="primary" />
              <Typography variant="h6">Create New Brand</Typography>
            </>
          )}
        </Box>
        
        <IconButton
          aria-label="close"
          onClick={handleClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Brand Name */}
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Brand Name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(errors.name)}
                helperText={errors.name || 'Enter a unique brand name'}
                required
                fullWidth
                disabled={loading}
                placeholder="e.g., Nike, Adidas, Apple"
                inputProps={{
                  maxLength: 255
                }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(errors.description)}
                helperText={errors.description || 'Optional brand description'}
                fullWidth
                multiline
                rows={3}
                disabled={loading}
                placeholder="Enter brand description (optional)"
                inputProps={{
                  maxLength: 1000
                }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    disabled={loading}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Brand Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.is_active 
                        ? 'Brand is active and visible' 
                        : 'Brand is inactive and hidden'
                      }
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            {/* Permission Warning */}
            {!canSave && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  You don't have permission to {isEditMode ? 'edit' : 'create'} brands.
                  Contact your administrator for access.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            color="inherit"
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !canSave || Object.keys(errors).some(key => errors[key])}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ minWidth: 120 }}
          >
            {loading 
              ? 'Saving...' 
              : isEditMode 
                ? 'Update Brand' 
                : 'Create Brand'
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BrandForm;

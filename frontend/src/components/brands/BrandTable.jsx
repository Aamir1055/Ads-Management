import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Chip,
  Box,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const BrandTable = ({ 
  brands = [], 
  loading = false, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onView,
  permissions = {} 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const handleMenuOpen = (event, brand) => {
    setAnchorEl(event.currentTarget);
    setSelectedBrand(brand);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBrand(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    
    switch (action) {
      case 'view':
        onView?.(selectedBrand);
        break;
      case 'edit':
        onEdit?.(selectedBrand);
        break;
      case 'delete':
        onDelete?.(selectedBrand);
        break;
      case 'toggle-status':
        onToggleStatus?.(selectedBrand.id, !selectedBrand.is_active);
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Typography>Loading brands...</Typography>
      </Box>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Typography variant="body1" color="text.secondary">
          No brands found. Create your first brand to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Brand Name</strong></TableCell>
            <TableCell><strong>Description</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Created By</strong></TableCell>
            <TableCell><strong>Created At</strong></TableCell>
            <TableCell><strong>Updated At</strong></TableCell>
            <TableCell align="center"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {brands.map((brand) => (
            <TableRow key={brand.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {brand.name}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {brand.description || 'No description'}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Chip
                  icon={brand.is_active ? <ActiveIcon /> : <InactiveIcon />}
                  label={brand.is_active ? 'Active' : 'Inactive'}
                  color={brand.is_active ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              
              <TableCell>
                <Typography variant="body2">
                  {brand.created_by_username || 'System'}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(brand.created_at)}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {brand.updated_at ? formatDate(brand.updated_at) : '-'}
                </Typography>
              </TableCell>
              
              <TableCell align="center">
                <Tooltip title="More actions">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, brand)}
                    aria-label={`Actions for ${brand.name}`}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* View Action */}
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        {/* Edit Action */}
        {(permissions.brands_update || permissions.brands_create || onEdit) && (
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Brand</ListItemText>
          </MenuItem>
        )}

        {/* Toggle Status */}
        {(permissions.brands_update || permissions.brands_create || onToggleStatus) && (
          <MenuItem onClick={() => handleAction('toggle-status')}>
            <ListItemIcon>
              {selectedBrand?.is_active ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>
              {selectedBrand?.is_active ? 'Deactivate' : 'Activate'}
            </ListItemText>
          </MenuItem>
        )}

        {/* Divider before delete */}
        {(permissions.brands_delete || onDelete) && (
          <>
            <Divider />
            <MenuItem 
              onClick={() => handleAction('delete')}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete Brand</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </TableContainer>
  );
};

export default BrandTable;

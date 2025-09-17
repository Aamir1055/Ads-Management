import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Grid,
  Typography,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const BrandFilters = ({
  filters = {},
  onFiltersChange,
  onReset,
  loading = false
}) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'all',
    ...filters
  });
  const [expanded, setExpanded] = useState(false);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(prevFilters => ({
      ...prevFilters,
      ...filters
    }));
  }, [filters]);

  // Handle input changes
  const handleFilterChange = (name, value) => {
    const newFilters = {
      ...localFilters,
      [name]: value
    };
    
    setLocalFilters(newFilters);
    
    // Auto-apply for certain fields
    if (name === 'search') {
      // Debounce search
      if (value === '') {
        onFiltersChange(newFilters);
      }
    } else {
      // Apply immediately for dropdowns
      onFiltersChange(newFilters);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onFiltersChange(localFilters);
  };

  // Handle reset
  const handleReset = () => {
    const resetFilters = {
      search: '',
      status: 'all'
    };
    
    setLocalFilters(resetFilters);
    onReset?.(resetFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = localFilters.search || localFilters.status !== 'all';

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterIcon color="primary" />
          <Typography variant="h6" component="h2">
            Filters
          </Typography>
          {hasActiveFilters && (
            <Typography variant="body2" color="primary" sx={{ ml: 1 }}>
              (Active)
            </Typography>
          )}
        </Box>
        
        <IconButton
          onClick={() => setExpanded(!expanded)}
          size="small"
          aria-label={expanded ? "Hide filters" : "Show filters"}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <form onSubmit={handleSearchSubmit}>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                name="search"
                label="Search Brands"
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by name or description..."
                fullWidth
                size="small"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: localFilters.search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('search', '')}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={localFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                  disabled={loading}
                >
                  <MenuItem value="all">All Brands</MenuItem>
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="inactive">Inactive Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} sm={12} md={5}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  disabled={loading}
                  size="small"
                >
                  Search
                </Button>
                
                {hasActiveFilters && (
                  <Button
                    onClick={handleReset}
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    disabled={loading}
                    size="small"
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="body2" color="text.secondary">
              <strong>Active filters:</strong>
              {localFilters.search && ` Search: "${localFilters.search}"`}
              {localFilters.status !== 'all' && ` Status: ${localFilters.status}`}
            </Typography>
          </Box>
        )}
      </Collapse>

      {/* Compact view when collapsed */}
      <Collapse in={!expanded}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              name="search"
              label="Quick Search"
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search brands..."
              fullWidth
              size="small"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: localFilters.search && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleFilterChange('search', '')}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={localFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
                disabled={loading}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default BrandFilters;

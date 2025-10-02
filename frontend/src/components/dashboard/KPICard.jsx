import React from 'react';
import { TrendingUp, TrendingDown, Minus, Eye, EyeOff } from 'lucide-react';

const KPICard = ({ 
  title, 
  value, 
  previousValue,
  icon: Icon, 
  color = 'bg-blue-500',
  format = 'number',
  precision = 0,
  showTrend = true,
  loading = false,
  error = null,
  onClick = null,
  className = ''
}) => {
  // Format the display value
  const formatValue = (val, fmt = format) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    
    const numVal = Number(val);
    
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(numVal);
      
      case 'percentage':
        return `${numVal.toFixed(precision)}%`;
      
      case 'compact':
        if (numVal >= 1000000) {
          return `${(numVal / 1000000).toFixed(1)}M`;
        } else if (numVal >= 1000) {
          return `${(numVal / 1000).toFixed(1)}K`;
        }
        return numVal.toFixed(precision);
      
      case 'decimal':
        return numVal.toFixed(precision);
      
      default: // 'number'
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(numVal);
    }
  };

  // Calculate trend
  const calculateTrend = () => {
    if (!showTrend || !previousValue || previousValue === 0 || isNaN(value) || isNaN(previousValue)) {
      return { percentage: 0, direction: 'neutral', icon: Minus };
    }

    const current = Number(value);
    const previous = Number(previousValue);
    const change = ((current - previous) / previous) * 100;

    if (change > 0) {
      return { percentage: change, direction: 'up', icon: TrendingUp };
    } else if (change < 0) {
      return { percentage: Math.abs(change), direction: 'down', icon: TrendingDown };
    } else {
      return { percentage: 0, direction: 'neutral', icon: Minus };
    }
  };

  const trend = calculateTrend();
  const TrendIcon = trend.icon;

  if (loading) {
    return (
      <div className={`card animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card border-red-200 bg-red-50 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
          <div className="flex-shrink-0 p-2 rounded-md bg-red-100">
            <EyeOff className="h-4 w-4 text-red-600" />
          </div>
        </div>
        <p className="text-red-600 text-sm">Failed to load</p>
        <p className="text-xs text-red-500 mt-1">Click to retry</p>
      </div>
    );
  }

  return (
    <div 
      className={`card transition-all duration-200 hover:shadow-lg ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 truncate" title={title}>
          {title}
        </h3>
        <div className={`flex-shrink-0 ${color} rounded-md p-2`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900" title={`${title}: ${formatValue(value)}`}>
          {formatValue(value)}
        </p>
      </div>
      
      {showTrend && (
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-xs font-medium">
              {trend.percentage > 0 ? `${trend.percentage.toFixed(1)}%` : '0%'}
            </span>
          </div>
          <span className="text-xs text-gray-500">vs previous</span>
        </div>
      )}
    </div>
  );
};

export default KPICard;

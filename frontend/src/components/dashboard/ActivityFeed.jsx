import React, { useState } from 'react';
import { 
  FileText, 
  Target, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  UserPlus,
  Download,
  Settings,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ActivitySkeleton } from '../LoadingSkeleton';

const ActivityFeed = ({ activities = [], loading = false, title = 'Recent Activity', className = '', compact = false, maxVisible = 5 }) => {
  // Icon mapping for different activity types
  const getActivityIcon = (type) => {
    const iconMap = {
      'report_generated': FileText,
      'campaign_created': Target,
      'campaign_updated': Target,
      'user_registered': UserPlus,
      'user_login': Users,
      'analytics_view': BarChart3,
      'data_export': Download,
      'system_update': Settings,
      'performance_alert': AlertCircle,
      'milestone_reached': CheckCircle,
      'data_refresh': RefreshCw,
      'trend_detected': TrendingUp
    };
    
    return iconMap[type] || FileText;
  };

  // Color mapping for different activity types
  const getActivityColor = (type) => {
    const colorMap = {
      'report_generated': 'text-blue-600 bg-blue-100',
      'campaign_created': 'text-green-600 bg-green-100',
      'campaign_updated': 'text-yellow-600 bg-yellow-100',
      'user_registered': 'text-purple-600 bg-purple-100',
      'user_login': 'text-gray-600 bg-gray-100',
      'analytics_view': 'text-indigo-600 bg-indigo-100',
      'data_export': 'text-orange-600 bg-orange-100',
      'system_update': 'text-cyan-600 bg-cyan-100',
      'performance_alert': 'text-red-600 bg-red-100',
      'milestone_reached': 'text-emerald-600 bg-emerald-100',
      'data_refresh': 'text-teal-600 bg-teal-100',
      'trend_detected': 'text-pink-600 bg-pink-100'
    };
    
    return colorMap[type] || 'text-gray-600 bg-gray-100';
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const [showAll, setShowAll] = useState(false);
  
  if (loading) {
    return <ActivitySkeleton />;
  }

  const visibleActivities = compact && !showAll ? activities.slice(0, maxVisible) : activities;
  const hasMore = activities.length > maxVisible;

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>{title}</h3>
        {activities && activities.length > 0 && (
          <span className="text-xs text-gray-500">
            {activities.length} activities
          </span>
        )}
      </div>

      <div className={`space-y-${compact ? '1' : '3'}`}>
        {!activities || activities.length === 0 ? (
          <div className={`text-center ${compact ? 'py-3' : 'py-8'}`}>
            <div className="text-gray-400 mb-2">
              <BarChart3 className={`${compact ? 'h-6 w-6' : 'h-12 w-12'} mx-auto`} />
            </div>
            <p className="text-gray-500 text-sm">No recent activities</p>
            {!compact && (
              <p className="text-gray-400 text-xs mt-1">
                Activities will appear here as they happen
              </p>
            )}
          </div>
        ) : (
          visibleActivities.map((activity) => {
            const IconComponent = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div 
                key={activity.id} 
                className={`flex items-${compact ? 'center' : 'start'} space-x-${compact ? '2' : '3'} ${compact ? 'py-1.5 px-1.5' : 'py-3 px-2'} hover:bg-gray-50 rounded-lg -mx-${compact ? '1.5' : '2'} transition-colors duration-150`}
              >
                <div className={`flex-shrink-0 ${compact ? 'w-5 h-5' : 'w-8 h-8'} rounded-full flex items-center justify-center ${colorClass}`}>
                  <IconComponent className={`${compact ? 'h-2.5 w-2.5' : 'h-4 w-4'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  {compact ? (
                    // Ultra-compact single line layout
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {activity.title || 'System Activity'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-1.5 text-xs text-gray-500">
                        <span>{formatRelativeTime(activity.timestamp)}</span>
                        {activity.status && (
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            activity.status === 'success' ? 'bg-green-500' :
                            activity.status === 'warning' ? 'bg-yellow-500' :
                            activity.status === 'error' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                        )}
                      </div>
                    </div>
                  ) : (
                    // Standard layout
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {activity.title || 'System Activity'}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mb-1">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatRelativeTime(activity.timestamp)}</span>
                          {activity.user && activity.user !== 'System' && (
                            <>
                              <span>•</span>
                              <span>by {activity.user}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {activity.status && (
                        <div className={`flex-shrink-0 ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'success' ? 'bg-green-100 text-green-800' :
                          activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          activity.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Show more/less button for compact mode */}
      {compact && hasMore && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-center w-full text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150 py-1"
          >
            <span className="mr-1">
              {showAll ? 'Show Less' : `+${activities.length - maxVisible} More`}
            </span>
            {showAll ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
        </div>
      )}

      {/* Footer with link to view all activities - only for non-compact mode */}
      {!compact && activities && activities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button 
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
            onClick={() => {
              // Navigate to full activity log
              console.log('Navigate to full activity log');
            }}
          >
            View all activities →
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;

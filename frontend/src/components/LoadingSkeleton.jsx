import React from 'react';

const LoadingSkeleton = ({ width = 'w-full', height = 'h-4', className = '' }) => {
  return (
    <div className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`}></div>
  );
};

export const CardSkeleton = ({ showChart = false }) => {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <LoadingSkeleton width="w-32" height="h-5" />
        <LoadingSkeleton width="w-8" height="h-8" className="rounded-full" />
      </div>
      <div className="mb-2">
        <LoadingSkeleton width="w-24" height="h-8" />
      </div>
      <div className="flex items-center space-x-2">
        <LoadingSkeleton width="w-16" height="h-4" />
        <LoadingSkeleton width="w-12" height="h-4" />
      </div>
      {showChart && (
        <div className="mt-4">
          <LoadingSkeleton width="w-full" height="h-20" />
        </div>
      )}
    </div>
  );
};

export const ChartSkeleton = ({ height = 'h-64' }) => {
  return (
    <div className="card animate-pulse">
      <div className="mb-4">
        <LoadingSkeleton width="w-48" height="h-6" />
      </div>
      <LoadingSkeleton width="w-full" height={height} />
      <div className="flex justify-center mt-4 space-x-4">
        <LoadingSkeleton width="w-16" height="h-3" />
        <LoadingSkeleton width="w-20" height="h-3" />
        <LoadingSkeleton width="w-18" height="h-3" />
      </div>
    </div>
  );
};

export const ActivitySkeleton = () => {
  return (
    <div className="card animate-pulse">
      <div className="mb-4">
        <LoadingSkeleton width="w-40" height="h-6" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex items-start space-x-3">
            <LoadingSkeleton width="w-10" height="h-10" className="rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton width="w-3/4" height="h-4" />
              <LoadingSkeleton width="w-1/2" height="h-3" />
              <LoadingSkeleton width="w-20" height="h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="card animate-pulse">
      <div className="mb-4">
        <LoadingSkeleton width="w-48" height="h-6" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <LoadingSkeleton width="w-24" height="h-4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <LoadingSkeleton width="w-20" height="h-4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoadingSkeleton;

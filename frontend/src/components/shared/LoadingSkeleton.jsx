import React from 'react';

const LoadingSkeleton = ({ rows = 3, height = 20 }) => {
  return (
    <div className="flex flex-col space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-800 rounded"
          style={{ height: `${height}px`, width: i === rows - 1 ? '70%' : '100%' }}
        ></div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;

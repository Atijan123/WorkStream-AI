import React from 'react';

interface ProgressBarProps {
  value?: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

/**
 * Create a progress bar component with customizable colors, sizes, and animation
 * Generated component based on natural language request
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'medium',
  animated = false
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const backgroundColorClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100'
  };

  return (
    <div className="p-4 border-gray-200 bg-white max-w-md border rounded-lg">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      
      <div className={`w-full ${backgroundColorClasses[color]} rounded-full ${sizeClasses[size]}`}>
        <div
          className={`
            ${colorClasses[color]} 
            ${sizeClasses[size]} 
            rounded-full 
            transition-all 
            duration-300 
            ease-in-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      
      {size === 'large' && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {value} / {max}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
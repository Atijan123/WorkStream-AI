import React from 'react';

interface NotificationBadgeProps {
  count?: number;
  maxCount?: number;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Create a notification badge component that shows notification count with customizable colors and sizes
 * Generated component based on natural language request
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count = 0, 
  maxCount = 99, 
  color = 'red',
  size = 'medium' 
}) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  const colorClasses = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    purple: 'bg-purple-500 text-white'
  };

  const sizeClasses = {
    small: 'h-4 w-4 text-xs min-w-[1rem]',
    medium: 'h-5 w-5 text-xs min-w-[1.25rem]',
    large: 'h-6 w-6 text-sm min-w-[1.5rem]'
  };

  if (count === 0) {
    return null;
  }

  return (
    <span className={`
      inline-flex items-center justify-center 
      rounded-full font-medium
      ${colorClasses[color]} 
      ${sizeClasses[size]}
    `}>
      {displayCount}
    </span>
  );
};

export default NotificationBadge;
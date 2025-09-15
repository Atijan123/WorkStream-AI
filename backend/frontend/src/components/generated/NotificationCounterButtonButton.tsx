import React from 'react';

interface NotificationCounterButtonButtonProps {}

/**
 * Build a notification counter button
 * Generated component based on natural language request
 */
export const NotificationCounterButtonButton: React.FC<NotificationCounterButtonButtonProps> = ({}) => {
  return (
    <button
      className="p-4 border-gray-200 bg-white border rounded-lg px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
      onClick={() => console.log('Button clicked')}
    >
      "Click Me"
    </button>
  );
};

export default NotificationCounterButtonButton;

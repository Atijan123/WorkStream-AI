import React from 'react';

interface QuickActionButtonProps {
  title?: string;
  action?: string;
}

/**
 * Add a quick action button that can trigger workflow executions manually
 * Generated component based on natural language request
 */
export const QuickActionButton: React.FC<QuickActionButtonProps> = ({ title, action: _action }) => {
  return (
    <button
      className="p-4 border-green-200 bg-green-50 max-w-md border rounded-lg px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
      onClick={() => console.log('Button clicked')}
    >
      {title || "Execute Workflow"}
    </button>
  );
};

export default QuickActionButton;
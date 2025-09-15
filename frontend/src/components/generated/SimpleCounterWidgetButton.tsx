import React from 'react';

interface SimpleCounterWidgetButtonProps {
  className?: string;
}

/**
 * I want a simple counter widget that shows a number and increment button
 * Generated component - Auto-created from feature request
 */
const SimpleCounterWidgetButton: React.FC<SimpleCounterWidgetButtonProps> = ({ className = '' }) => {
  const [clicked, setClicked] = React.useState(false);
  
  return (
    <div className={`p-4 ${className}`}>
      <button
        onClick={() => setClicked(!clicked)}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          clicked 
            ? 'bg-green-600 text-white' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {clicked ? 'Clicked!' : 'I want a simple counter widget that shows a number and increment button'}
      </button>
    </div>
  );
};

export default SimpleCounterWidgetButton;
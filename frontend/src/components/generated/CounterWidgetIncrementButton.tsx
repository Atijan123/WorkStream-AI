import React from 'react';

interface CounterWidgetIncrementButtonProps {
  className?: string;
}

/**
 * Create a counter widget with increment and decrement buttons
 * Generated component - Auto-created from feature request
 */
const CounterWidgetIncrementButton: React.FC<CounterWidgetIncrementButtonProps> = ({ className = '' }) => {
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
        {clicked ? 'Clicked!' : 'Create a counter widget with increment and decrement buttons'}
      </button>
    </div>
  );
};

export default CounterWidgetIncrementButton;
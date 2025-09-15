import React from 'react';

interface TestDynamicComponentProps {
  title?: string;
}

/**
 * Test component for dynamic loading functionality
 * Generated component to verify the dynamic import system works correctly
 */
export const TestDynamicComponent: React.FC<TestDynamicComponentProps> = ({ 
  title = "Dynamic Loading Test" 
}) => {
  return (
    <div className="p-4 border-gray-200 bg-white border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-green-600">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600">Dynamic</span>
        </div>
      </div>
      
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-green-800">Dynamic Loading Success!</h4>
            <p className="mt-1 text-sm text-green-700">
              This component was loaded dynamically from the features list. 
              The system successfully imported and rendered this component at runtime.
            </p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">✓</div>
            <div className="text-xs text-green-600">Import Success</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">✓</div>
            <div className="text-xs text-green-600">Render Success</div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Component loaded at: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default TestDynamicComponent;
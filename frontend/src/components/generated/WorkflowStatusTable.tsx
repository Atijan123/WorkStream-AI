import React from 'react';

interface WorkflowStatusTableProps {
  title?: string;
  dataSource?: string;
}

/**
 * I need a table that shows all workflow statuses with their last execution times and success rates
 * Generated component based on natural language request
 */
export const WorkflowStatusTable: React.FC<WorkflowStatusTableProps> = ({ title, dataSource: _dataSource }) => {
  return (
    <div className="p-4 border-gray-200 bg-white max-w-md border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{title || "Workflow Status Table"}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workflow Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Success Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Daily Sales Report</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">95%</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">System Health Check</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkflowStatusTable;
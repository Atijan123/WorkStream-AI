import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
}

interface TaskColumn {
  id: string;
  title: string;
  tasks: Task[];
}

interface TaskBoardProps {
  title?: string;
  columns?: TaskColumn[];
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void;
  onTaskClick?: (task: Task) => void;
}

/**
 * Create a task management board for organizing workflow tasks
 * Generated component based on natural language request
 */
export const TaskBoard: React.FC<TaskBoardProps> = ({ 
  title = "Task Management Board",
  columns = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        {
          id: '1',
          title: 'Setup database schema',
          description: 'Create initial database tables for user management',
          priority: 'high',
          assignee: 'John Doe',
          dueDate: '2024-01-15'
        },
        {
          id: '2',
          title: 'Design API endpoints',
          description: 'Define REST API structure for the application',
          priority: 'medium',
          assignee: 'Jane Smith'
        }
      ]
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      tasks: [
        {
          id: '3',
          title: 'Implement authentication',
          description: 'Add JWT-based authentication system',
          priority: 'high',
          assignee: 'Mike Johnson',
          dueDate: '2024-01-20'
        }
      ]
    },
    {
      id: 'review',
      title: 'Review',
      tasks: [
        {
          id: '4',
          title: 'Code review for user service',
          description: 'Review and approve user management service implementation',
          priority: 'medium',
          assignee: 'Sarah Wilson'
        }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        {
          id: '5',
          title: 'Project setup',
          description: 'Initialize project structure and dependencies',
          priority: 'low',
          assignee: 'Team Lead'
        }
      ]
    }
  ],
  onTaskMove,
  onTaskClick
}) => {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (priority) {
      case 'high':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'low':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string, columnId: string) => {
    setDraggedTask(taskId);
    setDraggedFrom(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    
    if (draggedTask && draggedFrom && draggedFrom !== columnId) {
      onTaskMove?.(draggedTask, draggedFrom, columnId);
    }
    
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 border-gray-200 bg-white border rounded-lg max-w-7xl">
      <h3 className="text-xl font-semibold mb-6 text-gray-800">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className="bg-gray-50 rounded-lg p-4 min-h-[400px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-700">{column.title}</h4>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                {column.tasks.length}
              </span>
            </div>
            
            {/* Tasks */}
            <div className="space-y-3">
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                  onClick={() => onTaskClick?.(task)}
                  className={`
                    bg-white rounded-lg p-3 shadow-sm border-l-4 cursor-pointer
                    hover:shadow-md transition-shadow duration-200
                    ${getPriorityColor(task.priority)}
                    ${draggedTask === task.id ? 'opacity-50' : ''}
                  `}
                >
                  {/* Task Title */}
                  <h5 className="font-medium text-gray-800 mb-2 line-clamp-2">
                    {task.title}
                  </h5>
                  
                  {/* Task Description */}
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  {/* Task Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {/* Priority Badge */}
                      <span className={getPriorityBadge(task.priority)}>
                        {task.priority}
                      </span>
                      
                      {/* Due Date */}
                      {task.dueDate && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                    
                    {/* Assignee Avatar */}
                    {task.assignee && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {task.assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Add Task Button */}
              <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Task
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Board Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-blue-800">
            {columns.reduce((sum, col) => sum + col.tasks.length, 0)}
          </div>
          <div className="text-sm text-blue-600">Total Tasks</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-red-800">
            {columns.reduce((sum, col) => sum + col.tasks.filter(t => t.priority === 'high').length, 0)}
          </div>
          <div className="text-sm text-red-600">High Priority</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-yellow-800">
            {columns.find(col => col.id === 'inprogress')?.tasks.length || 0}
          </div>
          <div className="text-sm text-yellow-600">In Progress</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-semibold text-green-800">
            {columns.find(col => col.id === 'done')?.tasks.length || 0}
          </div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
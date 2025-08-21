import React from 'react';

interface UserProfileCardProps {
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

/**
 * Create a user profile card component that displays user information with avatar, name, email and role
 * Generated component based on natural language request
 */
export const UserProfileCard: React.FC<UserProfileCardProps> = ({ name, email, avatar, role }) => {
  return (
    <div className="p-4 border-blue-200 bg-blue-50 max-w-md border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {avatar ? (
            <img
              className="h-12 w-12 rounded-full object-cover"
              src={avatar}
              alt={name || 'User avatar'}
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {name || "John Doe"}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {email || "john.doe@example.com"}
          </p>
          {role && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
              {role}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
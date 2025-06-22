'use client';

import { useAuth } from '@/context/AuthContext';

export default function UserProfile() {
  const { user, logout, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center space-x-4">
        {user?.image && (
          <img 
            src={user.image} 
            alt={user.name || 'User'} 
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <h3 className="font-medium">{user?.name || 'User'}</h3>
          <p className="text-sm text-gray-500">{user?.email || ''}</p>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
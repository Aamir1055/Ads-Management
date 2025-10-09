import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthTest = () => {
  const { user, token, loading, isAuthenticated } = useAuth();

  console.log('🧪 AuthTest Component:', {
    hasUser: !!user,
    hasToken: !!token,
    loading,
    authResult: isAuthenticated(),
    userData: user,
    tokenPreview: token?.substring(0, 50)
  });

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Authentication Test</h2>
      
      <div className="space-y-2 text-sm">
        <div>Loading: <span className={loading ? 'text-yellow-600' : 'text-green-600'}>{loading.toString()}</span></div>
        <div>Has User: <span className={user ? 'text-green-600' : 'text-red-600'}>{(!!user).toString()}</span></div>
        <div>Has Token: <span className={token ? 'text-green-600' : 'text-red-600'}>{(!!token).toString()}</span></div>
        <div>isAuthenticated(): <span className={isAuthenticated() ? 'text-green-600' : 'text-red-600'}>{isAuthenticated().toString()}</span></div>
        
        {user && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <strong>User Data:</strong>
            <pre className="text-xs mt-1">{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
        
        {token && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <strong>Token Preview:</strong>
            <div className="text-xs mt-1 font-mono">{token.substring(0, 100)}...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthTest;
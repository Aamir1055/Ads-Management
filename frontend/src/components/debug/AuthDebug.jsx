import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthDebug = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-md text-xs z-50"
        style={{ fontSize: '10px' }}
      >
        Debug Auth
      </button>
    );
  }

  const authData = {
    isAuthenticated: isAuthenticated(),
    hasUser: !!user,
    hasToken: !!token,
    localStorage: {
      access_token: !!localStorage.getItem('access_token'),
      refresh_token: !!localStorage.getItem('refresh_token'),
      authToken: !!localStorage.getItem('authToken'),
      user: !!localStorage.getItem('user')
    },
    userInfo: user ? {
      id: user.id,
      username: user.username,
      role: user.role_name || user.role,
    } : null
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 rounded-lg p-4 max-w-sm z-50 shadow-lg text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-red-600">Auth Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Auth Status:</strong> {authData.isAuthenticated ? '✅' : '❌'}
        </div>
        <div>
          <strong>Has User:</strong> {authData.hasUser ? '✅' : '❌'}
        </div>
        <div>
          <strong>Has Token:</strong> {authData.hasToken ? '✅' : '❌'}
        </div>
        
        <div className="border-t pt-2">
          <strong>LocalStorage:</strong>
          <ul className="ml-2">
            <li>access_token: {authData.localStorage.access_token ? '✅' : '❌'}</li>
            <li>refresh_token: {authData.localStorage.refresh_token ? '✅' : '❌'}</li>
            <li>authToken: {authData.localStorage.authToken ? '✅' : '❌'}</li>
            <li>user: {authData.localStorage.user ? '✅' : '❌'}</li>
          </ul>
        </div>

        {authData.userInfo && (
          <div className="border-t pt-2">
            <strong>User Info:</strong>
            <ul className="ml-2">
              <li>ID: {authData.userInfo.id}</li>
              <li>Username: {authData.userInfo.username}</li>
              <li>Role: {authData.userInfo.role}</li>
            </ul>
          </div>
        )}

        <div className="border-t pt-2">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs mr-2"
          >
            Clear All & Reload
          </button>
          <button
            onClick={() => {
              console.log('Full Auth Debug:', {
                ...authData,
                tokens: {
                  access_token: localStorage.getItem('access_token'),
                  refresh_token: localStorage.getItem('refresh_token'),
                  authToken: localStorage.getItem('authToken')
                }
              });
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Log to Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;

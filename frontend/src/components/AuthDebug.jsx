import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebug = () => {
  const { user, token, loading, isAuthenticated } = useAuth();
  const [authData, setAuthData] = useState({});

  useEffect(() => {
    const updateAuthData = () => {
      const data = {
        timestamp: new Date().toISOString(),
        contextUser: !!user,
        contextToken: !!token,
        contextLoading: loading,
        isAuthenticatedResult: isAuthenticated(),
        localStorageAccessToken: !!localStorage.getItem('access_token'),
        localStorageRefreshToken: !!localStorage.getItem('refresh_token'),
        localStorageUser: !!localStorage.getItem('user'),
        pathname: window.location.pathname,
        userObj: user,
        tokenPreview: token ? token.substring(0, 20) + '...' : null,
        accessTokenPreview: localStorage.getItem('access_token') ? localStorage.getItem('access_token').substring(0, 20) + '...' : null
      };
      setAuthData(data);
      console.log('🔍 AUTH DEBUG:', data);
    };

    updateAuthData();
    const interval = setInterval(updateAuthData, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [user, token, loading, isAuthenticated]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <h4>Auth Debug Panel</h4>
      <div>Path: {authData.pathname}</div>
      <div>Loading: {authData.contextLoading ? 'YES' : 'NO'}</div>
      <div>Context User: {authData.contextUser ? 'YES' : 'NO'}</div>
      <div>Context Token: {authData.contextToken ? 'YES' : 'NO'}</div>
      <div>isAuthenticated(): {authData.isAuthenticatedResult ? 'YES' : 'NO'}</div>
      <div>localStorage access_token: {authData.localStorageAccessToken ? 'YES' : 'NO'}</div>
      <div>localStorage user: {authData.localStorageUser ? 'YES' : 'NO'}</div>
      <div>Token Preview: {authData.tokenPreview}</div>
      <div>Access Token Preview: {authData.accessTokenPreview}</div>
      <div>Last Update: {authData.timestamp}</div>
    </div>
  );
};

export default AuthDebug;
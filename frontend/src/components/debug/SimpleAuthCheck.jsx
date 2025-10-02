import React, { useEffect, useState } from 'react';

const SimpleAuthCheck = () => {
  const [authInfo, setAuthInfo] = useState({});

  useEffect(() => {
    const checkAuth = () => {
      const info = {
        timestamp: new Date().toLocaleTimeString(),
        localStorage: {
          access_token: localStorage.getItem('access_token'),
          refresh_token: localStorage.getItem('refresh_token'),
          authToken: localStorage.getItem('authToken'),
          user: localStorage.getItem('user')
        },
        hasAccessToken: !!localStorage.getItem('access_token'),
        hasRefreshToken: !!localStorage.getItem('refresh_token'),
        hasUser: !!localStorage.getItem('user')
      };
      
      setAuthInfo(info);
      console.log('Auth Check:', info);
    };

    checkAuth();
    const interval = setInterval(checkAuth, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'white', 
        border: '2px solid red', 
        padding: '10px', 
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', color: 'red' }}>Auth Status</h3>
      <div>
        <strong>Last Check:</strong> {authInfo.timestamp}<br/>
        <strong>Access Token:</strong> {authInfo.hasAccessToken ? '✅' : '❌'}<br/>
        <strong>Refresh Token:</strong> {authInfo.hasRefreshToken ? '✅' : '❌'}<br/>
        <strong>User Data:</strong> {authInfo.hasUser ? '✅' : '❌'}<br/>
      </div>
      
      {authInfo.hasAccessToken && (
        <div style={{ marginTop: '10px', padding: '5px', background: '#f0f0f0', fontSize: '10px' }}>
          <strong>Token (first 20 chars):</strong><br/>
          {authInfo.localStorage.access_token?.substring(0, 20)}...
        </div>
      )}
      
      <button 
        onClick={() => {
          console.log('Full Auth Data:', authInfo);
          alert('Check console for full auth data');
        }}
        style={{ 
          marginTop: '10px', 
          padding: '5px', 
          background: 'blue', 
          color: 'white', 
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Log to Console
      </button>
    </div>
  );
};

export default SimpleAuthCheck;

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const SimpleDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Dashboard</h1>
      <p>Welcome, {user?.username || 'User'}!</p>
      <p>This is a simple dashboard to test authentication without complex logic.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>User Info:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Local Storage Tokens:</h3>
        <div>Access Token: {localStorage.getItem('access_token') ? 'Present' : 'Not Found'}</div>
        <div>Refresh Token: {localStorage.getItem('refresh_token') ? 'Present' : 'Not Found'}</div>
        <div>User Data: {localStorage.getItem('user') ? 'Present' : 'Not Found'}</div>
      </div>

      <button 
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default SimpleDashboard;
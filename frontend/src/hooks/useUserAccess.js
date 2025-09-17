import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useUserAccess = () => {
  const [userAccess, setUserAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/user-access/modules');
      
      if (response.data.success) {
        setUserAccess(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching user access:', err);
      setError(err.response?.data?.message || 'Failed to fetch user permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is logged in
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
      fetchUserAccess();
    } else {
      setLoading(false);
    }
  }, []);

  return {
    userAccess,
    loading,
    error,
    refetch: fetchUserAccess
  };
};

export default useUserAccess;

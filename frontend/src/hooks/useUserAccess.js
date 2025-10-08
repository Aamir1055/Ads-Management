import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useUserAccess = () => {
  const [userAccess, setUserAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserAccess = async () => {
    try {
      console.log('🔐 [useUserAccess] Starting to fetch user access...');
      setLoading(true);
      setError(null);
      
      const response = await api.get('/user-access/modules');
      console.log('🔐 [useUserAccess] API response:', response.data);
      
      if (response.data.success) {
        console.log('✅ [useUserAccess] User access data received:', response.data.data);
        setUserAccess(response.data.data);
      } else {
        console.log('❌ [useUserAccess] API returned error:', response.data.message);
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ [useUserAccess] Error fetching user access:', err);
      console.log('❌ [useUserAccess] Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setError(err.response?.data?.message || 'Failed to fetch user permissions');
    } finally {
      console.log('🔐 [useUserAccess] Finished loading, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is logged in
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    console.log('🔐 [useUserAccess] useEffect triggered. Token:', token ? 'EXISTS' : 'NOT FOUND');
    
    if (token) {
      console.log('🔐 [useUserAccess] Token found, calling fetchUserAccess...');
      fetchUserAccess();
    } else {
      console.log('⚠️ [useUserAccess] No token found, setting loading to false');
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

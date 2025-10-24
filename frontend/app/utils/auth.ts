// Get the auth header for API requests
export const getAuthHeader = async () => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    return {
        Authorization: `Bearer ${token}`
    };
};
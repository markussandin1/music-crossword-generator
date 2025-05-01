import { useState, useCallback } from 'react';

/**
 * Custom hook for handling API requests with loading and error states
 * @param {Function} apiFunction - API function to call
 * @returns {Object} - Object containing fetch function, loading state, error state, and data
 */
const useFetch = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction(...args);
      setData(response.data);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { 
    execute, 
    loading, 
    error, 
    data,
    reset
  };
};

export default useFetch;
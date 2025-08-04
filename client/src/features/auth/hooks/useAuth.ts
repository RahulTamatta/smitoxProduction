import { useState, useContext } from 'react';
import { AuthContext } from '../../../context/authContext';
import { authApi } from '../api/authApi';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authContext = useContext(AuthContext);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(credentials);
      // Handle successful login
      return response;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(userData);
      return response;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      // Handle logout
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    ...authContext,
    login,
    register,
    logout,
    loading,
    error
  };
};

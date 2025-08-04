import { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';

export const useAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDashboardStats();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData
  };
};

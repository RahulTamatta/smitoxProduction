import { useState, useEffect } from 'react';
import { categoriesApi } from '../api/categoriesApi';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newCategory = await categoriesApi.createCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory
  };
};

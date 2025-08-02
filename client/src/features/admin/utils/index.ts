// ===================================
// ADMIN UTILITY FUNCTIONS
// ===================================

import { Product, Order } from '../types';

// Format currency
export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Format relative time
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate required fields
export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get status color
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'Pending': '#f59e0b',
    'Confirmed': '#3b82f6',
    'Accepted': '#10b981',
    'Cancelled': '#ef4444',
    'Rejected': '#ef4444',
    'Dispatched': '#8b5cf6',
    'Delivered': '#059669',
    'Returned': '#f97316',
    'active': '#10b981',
    'inactive': '#ef4444',
  };
  return statusColors[status] || '#6b7280';
};

// Calculate pagination info
export const calculatePaginationInfo = (
  currentPage: number,
  totalItems: number,
  itemsPerPage: number
) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return {
    totalPages,
    startItem,
    endItem,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

// Generate pagination array
export const generatePaginationArray = (
  currentPage: number,
  totalPages: number,
  maxVisible = 5
): (number | string)[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  if (currentPage <= halfVisible) {
    for (let i = 1; i <= maxVisible - 1; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - halfVisible + 1) {
    pages.push(1);
    pages.push('...');
    for (let i = totalPages - maxVisible + 2; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    pages.push('...');
    for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  }

  return pages;
};

// Sort products
export const sortProducts = (products: Product[], sortBy: string, sortOrder: 'asc' | 'desc') => {
  return [...products].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = a.perPiecePrice;
        bValue = b.perPiecePrice;
        break;
      case 'stock':
        aValue = a.stock;
        bValue = b.stock;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

// Filter products
export const filterProducts = (products: Product[], filters: any) => {
  return products.filter(product => {
    // Filter by status
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'active':
          if (product.isActive !== '1') return false;
          break;
        case 'inactive':
          if (product.isActive !== '0') return false;
          break;
        case 'outOfStock':
          if (product.stock > 0) return false;
          break;
      }
    }

    // Filter by category
    if (filters.category && product.category._id !== filters.category) {
      return false;
    }

    // Filter by subcategory
    if (filters.subcategory && product.subcategory._id !== filters.subcategory) {
      return false;
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchFields = [
        product.name,
        product.description,
        product.category.name,
        product.subcategory.name,
        product.custom_order,
      ].join(' ').toLowerCase();
      
      if (!searchFields.includes(searchTerm)) return false;
    }

    return true;
  });
};

// Create form data for product
export const createProductFormData = (productData: any): FormData => {
  const formData = new FormData();
  
  // Add text fields
  Object.keys(productData).forEach(key => {
    if (key === 'multipleimages' || key === 'photo') return;
    
    if (Array.isArray(productData[key])) {
      formData.append(key, JSON.stringify(productData[key]));
    } else {
      formData.append(key, productData[key]);
    }
  });

  // Add images
  if (productData.photo && productData.photo instanceof File) {
    formData.append('photo', productData.photo);
  }

  if (productData.multipleimages && Array.isArray(productData.multipleimages)) {
    productData.multipleimages.forEach((file: File) => {
      formData.append('multipleimages', file);
    });
  }

  return formData;
};

// Download CSV
export const downloadCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Handle async operations with error handling
export const handleAsync = async <T>(
  asyncFn: () => Promise<T>,
  onSuccess?: (result: T) => void,
  onError?: (error: Error) => void
): Promise<[T | null, Error | null]> => {
  try {
    const result = await asyncFn();
    onSuccess?.(result);
    return [result, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError?.(err);
    return [null, err];
  }
};

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from 'react-router-dom';

export const useProductsData = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize state from URL search params
  const urlParams = new URLSearchParams(location.search);
  const pageFromUrl = parseInt(urlParams.get('page')) || 1;
  const searchFromUrl = urlParams.get('search') || "";
  const filterFromUrl = urlParams.get('filter') || "all";

  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState(filterFromUrl);
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [itemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch products with current filters
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/get-product`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          filter: filter,
        }
      });

      if (data.success) {
        setProducts(data.products);
        setTotalProducts(data.total);
        // Update URL without reload
        const params = new URLSearchParams({
          page: currentPage,
          ...(searchTerm && { search: searchTerm }),
          ...(filter !== 'all' && { filter: filter })
        }).toString();
        window.history.replaceState({}, '', `?${params}`);
      }
    } catch (error) {
      // toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(location.search);
      setCurrentPage(parseInt(params.get('page')) || 1);
      setSearchTerm(params.get('search') || "");
      setFilter(params.get('filter') || "all");
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [location]);

  useEffect(() => {
    getAllProducts();
  }, [currentPage, searchTerm, filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) return;
    
    try {
      if (action === "delete" && !window.confirm("Are you sure?")) return;
      
      const endpoints = selectedProducts.map(id => {
        if (action === "delete") {
          return axios.delete(`/api/v1/product/delete-product/${id}`);
        }
        return axios.put(`/api/v1/product/updateStatus/products/${id}`, {
          isActive: action === "activate" ? "1" : "0"
        });
      });

      await Promise.all(endpoints);
      await getAllProducts();
      setSelectedProducts([]);
      // toast.success(`Bulk ${action} successful`);
    } catch (error) {
      // toast.error(`Bulk ${action} failed`);
    }
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return {
    products,
    filter,
    searchTerm,
    currentPage,
    itemsPerPage,
    selectedProducts,
    setSelectedProducts,
    totalProducts,
    loading,
    totalPages,
    getAllProducts,
    handleFilterChange,
    handleSearch,
    handleBulkAction,
    toggleSelectAll,
    handlePageChange,
  };
};

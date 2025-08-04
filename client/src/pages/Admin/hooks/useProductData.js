import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export const useProductData = (auth) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Fetch all categories
  const getAllCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch all subcategories
  const getSubcategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/subcategory/get-subcategories");
      if (data?.success) {
        setSubcategories(data?.subcategories || []);
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.log(error);
      setSubcategories([]);
    }
  };

  // Fetch all brands
  const getAllBrands = async () => {
    try {
      const { data } = await axios.get("/api/v1/brand/get-brands");
      if (data?.success) {
        setBrands(data?.brands);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  // Filter subcategories by category
  const filterSubcategoriesByCategory = (categoryId) => {
    return subcategories.filter((subcat) => subcat.category === categoryId);
  };

  useEffect(() => {
    getAllCategories();
    getSubcategories();
    getAllBrands();
  }, []);

  return {
    categories,
    subcategories,
    brands,
    getAllCategories,
    getSubcategories,
    getAllBrands,
    filterSubcategoriesByCategory,
  };
};

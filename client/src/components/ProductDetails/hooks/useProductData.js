import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/auth';

export const useProductData = () => {
  const params = useParams();
  const [auth] = useAuth();
  const [product, setProduct] = useState({});
  const [productsForYou, setProductsForYou] = useState([]);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const prevSlugRef = useRef(params?.slug);
  const MAX_RETRIES = 3;

  const axiosConfig = {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  };

  // Reset product-specific state when slug changes
  useEffect(() => {
    if (prevSlugRef.current !== params?.slug) {
      setIsLoading(true);
      // We no longer setProduct({}) here so the old product stays visible 
      // under the loading overlay until the new one arrives.
      setProductsForYou([]);
      prevSlugRef.current = params?.slug;
    }

    if (params?.slug) {
      getProduct();
    }
  }, [params?.slug, auth?.user?.pincode]);

  useEffect(() => {
    // Robustly check for category/subcategory IDs whether they are objects or strings
    const categoryId = product.category?._id || (typeof product.category === 'string' ? product.category : null);
    const subcategoryId = product.subcategory?._id || (typeof product.subcategory === 'string' ? product.subcategory : null);

    // Subcategory is optional but category is required
    if (categoryId) {
      getProductsForYou(categoryId, subcategoryId);
    }
  }, [product.category, product.subcategory]);

  // Handle network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Connection restored');
      setIsNetworkError(false);
      if (retryAttempts > 0) {
        getProduct();
      }
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost');
      setIsNetworkError(true);
      toast.error("Internet connection lost. Please check your network.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryAttempts]);

  const getProduct = async () => {
    if (!navigator.onLine) {
      setIsNetworkError(true);
      setIsLoading(false);
      toast.error("No internet connection");
      return;
    }

    try {
      console.log(`[Product] Fetching product details for slug: ${params.slug}`);
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`,
        axiosConfig
      );

      if (data.success === true) {
        console.log('[Product] Product fetched successfully');

        // Parse multipleimages if it's a JSON string
        let processedProduct = { ...data.product };
        if (processedProduct.multipleimages && typeof processedProduct.multipleimages === 'string') {
          try {
            processedProduct.multipleimages = JSON.parse(processedProduct.multipleimages);
          } catch (error) {
            console.warn('Failed to parse multipleimages:', error);
            processedProduct.multipleimages = [];
          }
        }

        // Ensure multipleimages is an array and filter out invalid URLs
        if (Array.isArray(processedProduct.multipleimages)) {
          processedProduct.multipleimages = processedProduct.multipleimages.filter(img => {
            if (typeof img !== 'string' || !img.trim()) return false;
            if (img === '/placeholder-image.jpg') return false;
            if (img === 'null' || img === 'undefined' || img === '[null]' || img === '[undefined]') return false;
            if (img === '[]' || img === '{}' || img === 'null' || img === 'false') return false;
            // Accept relative paths from multer uploads (e.g. "uploads/products/filename.jpg")
            if (img.startsWith('uploads/')) return true;
            try {
              const url = new URL(img);
              return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
              return img.startsWith('/') && img !== '/' && img.length > 1;
            }
          });
        } else {
          processedProduct.multipleimages = [];
        }

        console.log('[Product] Processed multipleimages:', processedProduct.multipleimages);
        setProduct(processedProduct);
        setIsLoading(false);
        setRetryAttempts(0);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[Product] Error fetching product:', error);

      const isNetworkError = error.message && (
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('abort')
      );

      if (isNetworkError && retryAttempts < MAX_RETRIES) {
        console.log(`[Product] Retry attempt ${retryAttempts + 1}/${MAX_RETRIES}`);
        setRetryAttempts(prev => prev + 1);
        setTimeout(getProduct, 2000);
      } else {
        setIsLoading(false);
        toast.error("Failed to load product details. Please try again later.");
      }
    }
  };

  const getProductsForYou = async (categoryId, subcategoryId) => {
    try {
      const url = subcategoryId
        ? `/api/v1/productForYou/products/${categoryId}/${subcategoryId}`
        : `/api/v1/productForYou/products/${categoryId}`;

      const { data } = await axios.get(url);
      if (data?.success) {
        setProductsForYou(
          (data.products || []).map(item => ({
            ...item,
            productId: normalizeProductForCard(item.productId)
          }))
        );
      }
    } catch (error) {
      // Error handling is already commented out in original
    }
  };

  const checkPincode = async (pincode) => {
    try {
      const { data } = await axios.get("/api/v1/pincodes/get-pincodes");
      if (data.success) {
        const availablePincodes = data.pincodes.map((pin) => pin.code);
        // Original logic was commented out
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Helper function from original component
  const normalizeProductForCard = (product) => {
    const isValidImage = (val) =>
      typeof val === "string" && val.trim() !== "" && val !== "/placeholder-image.jpg";

    let photo = product?.photos;
    if (!isValidImage(photo)) {
      let images = product?.multipleimages;
      if (typeof images === "string") {
        try {
          images = JSON.parse(images);
        } catch {
          images = [];
        }
      }
      if (Array.isArray(images)) {
        images = images.filter(isValidImage);
        if (images.length > 0) {
          photo = images[0];
        }
      }
      if (!isValidImage(photo)) {
        photo = "/placeholder-image.jpg";
      }
    }
    return { ...product, photos: photo };
  };

  return {
    product,
    productsForYou,
    isNetworkError,
    isLoading,
    normalizeProductForCard
  };
};

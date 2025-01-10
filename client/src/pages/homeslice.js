import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks for API calls
export const fetchCategories = createAsyncThunk("home/fetchCategories", async () => {
  const { data } = await axios.get("/api/v1/category/get-category");
  return data?.category || [];
});

export const fetchProducts = createAsyncThunk("home/fetchProducts", async (page) => {
  const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
  return data?.products || [];
});

export const fetchProductCount = createAsyncThunk("home/fetchProductCount", async () => {
  const { data } = await axios.get("/api/v1/product/product-count");
  return data?.total || 0;
});

export const fetchBanners = createAsyncThunk("home/fetchBanners", async () => {
  const { data } = await axios.get("/api/v1/bannerManagement/get-banners");
  return data?.banners || [];
});

export const fetchProductsForYou = createAsyncThunk("home/fetchProductsForYou", async () => {
  const { data } = await axios.get("/api/v1/productForYou/get-all");
  return data?.productsForYou || [];
});

// Slice
const homeSlice = createSlice({
  name: "home",
  initialState: {
    categories: [],
    products: [],
    productsForYou: [],
    banners: [],
    totalProducts: 0,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = [...state.products, ...action.payload];
      })
      .addCase(fetchProductCount.fulfilled, (state, action) => {
        state.totalProducts = action.payload;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.banners = action.payload;
      })
      .addCase(fetchProductsForYou.fulfilled, (state, action) => {
        state.productsForYou = action.payload;
      })
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default homeSlice.reducer;

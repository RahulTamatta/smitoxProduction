import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  total: 0,
  page: 1,
  scrollPosition: 0, // Persist scroll position
};

const homepageSlice = createSlice({
  name: 'homepage',
  initialState,
  reducers: {
    setProducts(state, action) {
      state.products = action.payload;
    },
    setTotal(state, action) {
      state.total = action.payload;
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    appendProducts: (state, action) => {
      state.products = [...state.products, ...action.payload];
    },
    setScrollPosition(state, action) {
      state.scrollPosition = action.payload;
    },
  },
});

export const { setProducts, setTotal, setPage, setScrollPosition ,  appendProducts, } = homepageSlice.actions;
export default homepageSlice.reducer;

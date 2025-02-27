import { configureStore } from '@reduxjs/toolkit';
import scrollReducer from './scrollSlice';

const store = configureStore({
  reducer: {
    scroll: scrollReducer,
  },
});

export default store;

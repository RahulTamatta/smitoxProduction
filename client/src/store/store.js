import { configureStore } from '@reduxjs/toolkit';
import scrollSlice from '../redux/scrollSlice';

const store = configureStore({
  reducer: {
    scroll: scrollSlice,
  },
});

export default store;

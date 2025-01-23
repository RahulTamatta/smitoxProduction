import { configureStore } from '@reduxjs/toolkit';
import homepageReducer from './homepageslice';

const store = configureStore({
  reducer: {
    homepage: homepageReducer,
  },
});

export default store;

// store/index.js
import { configureStore } from '@reduxjs/toolkit'
import imageReducer from './slice'

export const store = configureStore({
  reducer: {
    images: imageReducer
  }
})
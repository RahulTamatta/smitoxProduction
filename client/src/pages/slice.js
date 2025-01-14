import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const initialState = {
  bannerImages: {},
  categoryImages: {},
  productImages: {},
  loading: false,
  error: null
}

export const fetchImage = createAsyncThunk(
  'images/fetchImage',
  async ({ id, type, url }, { rejectWithValue }) => {
    try {
      let imageUrl = url
      if (!url) {
        const response = await axios.get(`/api/v1/${type}/image/${id}`, {
          responseType: 'blob'
        })
        imageUrl = URL.createObjectURL(response.data)
      }
      return { id, type, url: imageUrl }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const imageSlice = createSlice({
  name: 'images',
  initialState,
  reducers: {
    clearImages: (state) => {
      // Cleanup object URLs to prevent memory leaks
      Object.values(state.bannerImages).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
      Object.values(state.categoryImages).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
      Object.values(state.productImages).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
      
      state.bannerImages = {}
      state.categoryImages = {}
      state.productImages = {}
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchImage.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchImage.fulfilled, (state, action) => {
        state.loading = false
        const { id, type, url } = action.payload
        switch (type) {
          case 'banner':
            state.bannerImages[id] = url
            break
          case 'category':
            state.categoryImages[id] = url
            break
          case 'product':
            state.productImages[id] = url
            break
          default:
            break
        }
      })
      .addCase(fetchImage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearImages } = imageSlice.actions
export default imageSlice.reducer
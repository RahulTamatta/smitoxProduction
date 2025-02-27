import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  scrollPositions: {},
};

const scrollSlice = createSlice({
  name: 'scroll',
  initialState,
  reducers: {
    setScrollPosition: (state, action) => {
      const { path, position } = action.payload;
      state.scrollPositions[path] = position;
    },
    clearScrollPosition: (state, action) => {
      const { path } = action.payload;
      delete state.scrollPositions[path];
    },
  },
});

export const { setScrollPosition, clearScrollPosition } = scrollSlice.actions;

export const selectScrollPosition = (state, path) => state.scroll.scrollPositions[path] || 0;

export default scrollSlice.reducer;

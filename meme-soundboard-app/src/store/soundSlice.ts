import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Sound } from '../models/Sound';

interface SoundState {
  sounds: Sound[];
  favorites: Sound[];
}

const initialState: SoundState = {
  sounds: [],
  favorites: [],
};

const soundSlice = createSlice({
  name: 'sound',
  initialState,
  reducers: {
    setSounds: (state, action: PayloadAction<Sound[]>) => {
      state.sounds = action.payload;
    },
    addFavorite: (state, action: PayloadAction<Sound>) => {
      if (!state.favorites.some(fav => fav.id === action.payload.id)) {
        state.favorites.push(action.payload);
      }
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter((sound) => sound.id !== action.payload);
    },
  },
});

export const { setSounds, addFavorite, removeFavorite } = soundSlice.actions;

export default soundSlice.reducer;

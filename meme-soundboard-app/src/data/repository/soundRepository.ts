import { Sound } from '../../models/Sound';
import { getSounds as getRemoteSounds, getSoundById as getRemoteSoundById } from '../remote/soundRemoteSource';
import { saveItem, getItem } from '../local/soundStorage';

const FAVORITE_SOUNDS_KEY = 'favoriteSounds';

interface SoundRepository {
  getSounds: () => Promise<Sound[]>;
  getSoundById: (id: string) => Promise<Sound | undefined>;
  getFavoriteSounds: () => Promise<Sound[]>;
  addFavoriteSound: (sound: Sound) => Promise<void>;
  removeFavoriteSound: (soundId: string) => Promise<void>;
  isSoundFavorite: (soundId: string) => Promise<boolean>;
}

export const soundRepository: SoundRepository = {
  getSounds: async () => {
    // In a real app, you might implement caching or combine local/remote sources
    return await getRemoteSounds();
  },

  getSoundById: async (id: string) => {
    // In a real app, you might implement caching or combine local/remote sources
    return await getRemoteSoundById(id);
  },

  getFavoriteSounds: async () => {
    const favorites = await getItem<Sound[]>(FAVORITE_SOUNDS_KEY);
    return favorites || [];
  },

  addFavoriteSound: async (sound: Sound) => {
    const favorites = (await getItem<Sound[]>(FAVORITE_SOUNDS_KEY)) || [];
    if (!favorites.some((fav) => fav.id === sound.id)) {
      favorites.push(sound);
      await saveItem(FAVORITE_SOUNDS_KEY, favorites);
    }
  },

  removeFavoriteSound: async (soundId: string) => {
    let favorites = (await getItem<Sound[]>(FAVORITE_SOUNDS_KEY)) || [];
    favorites = favorites.filter((fav) => fav.id !== soundId);
    await saveItem(FAVORITE_SOUNDS_KEY, favorites);
  },

  isSoundFavorite: async (soundId: string) => {
    const favorites = await soundRepository.getFavoriteSounds();
    return favorites.some((fav) => fav.id === soundId);
  },
};

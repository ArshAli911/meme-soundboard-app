import { Sound } from '../models/Sound';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { API_BASE_URL } from '../constants/config';

const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const soundApi = {
  uploadSoundFile: async (soundData: {
    name: string;
    category: string;
    tags?: string[];
    fileName: string;
    contentType: string;
    fileBase64: string;
  }, token: string): Promise<{ status: string; message: string; downloadUrl?: string }> => {
    const uploadSound = httpsCallable(functions, 'uploadSound');
    try {
      const result = await uploadSound(soundData);
      return result.data as { status: string; message: string; downloadUrl?: string };
    } catch (error) {
      console.error("Error calling uploadSound function:", error);
      throw error;
    }
  },

  fetchSounds: async (params?: { category?: string; searchName?: string; limit?: number; startAfterDocId?: string; }, token?: string): Promise<{ sounds: Sound[] }> => {
    const getSounds = httpsCallable(functions, 'getSounds');
    try {
      const result = await getSounds(params);
      return result.data as { sounds: Sound[] };
    } catch (error) {
      console.error("Error calling getSounds function:", error);
      throw error;
    }
  },

  favoriteSound: async (soundId: string, token: string): Promise<{ status: string; message: string }> => {
    const favoriteSoundCallable = httpsCallable(functions, 'favoriteSound');
    try {
      const result = await favoriteSoundCallable({ soundId });
      return result.data as { status: string; message: string };
    } catch (error) {
      console.error("Error calling favoriteSound function:", error);
      throw error;
    }
  },

  unfavoriteSound: async (soundId: string, token: string): Promise<{ status: string; message: string }> => {
    const unfavoriteSoundCallable = httpsCallable(functions, 'unfavoriteSound');
    try {
      const result = await unfavoriteSoundCallable({ soundId });
      return result.data as { status: string; message: string };
    } catch (error) {
      console.error("Error calling unfavoriteSound function:", error);
      throw error;
    }
  },

  fetchFavoritedSoundIds: async (token: string): Promise<{ soundIds: string[] }> => {
    const getFavoritedSoundIdsCallable = httpsCallable(functions, 'getFavoritedSoundIds');
    try {
      const result = await getFavoritedSoundIdsCallable({});
      return result.data as { soundIds: string[] };
    } catch (error) {
      console.error("Error calling getFavoritedSoundIds function:", error);
      throw error;
    }
  },

  getSoundsByIds: async (soundIds: string[], token?: string): Promise<{ sounds: Sound[] }> => {
    const getSoundsByIdsCallable = httpsCallable(functions, 'getSoundsByIds');
    try {
      const result = await getSoundsByIdsCallable({ soundIds });
      return result.data as { sounds: Sound[] };
    } catch (error) {
      console.error("Error calling getSoundsByIds function:", error);
      throw error;
    }
  },

  enqueueTranscodeJob: async (fileName: string, originalUrl: string, token: string): Promise<{ jobId: string, message: string }> => {
    const headers = { ...getAuthHeaders(token), 'Content-Type': 'application/json' };
    const response = await fetch(`${API_BASE_URL}/api/transcode-audio`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ fileName, originalUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  },
};

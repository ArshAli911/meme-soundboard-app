import { soundApi } from '../../api/soundApi';
import { Sound } from '../../models/Sound';

export const getSounds = async (params?: { category?: string; searchName?: string; limit?: number; startAfterDocId?: string; }, token?: string): Promise<Sound[]> => {
  const result = await soundApi.fetchSounds(params, token);
  return result.sounds;
};

export const getSoundById = async (id: string, token?: string): Promise<Sound | undefined> => {
  const result = await soundApi.getSoundsByIds([id], token);
  return result.sounds.find(sound => sound.id === id);
};

export const enqueueTranscodeJob = async (fileName: string, originalUrl: string, token: string): Promise<{ jobId: string, message: string }> => {
  const result = await soundApi.enqueueTranscodeJob(fileName, originalUrl, token);
  return result;
};

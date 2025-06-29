import { soundRepository } from '../data/repository/soundRepository';
import { Sound } from '../models/Sound';

export class SoundViewModel {
  async getSounds(): Promise<Sound[]> {
    return await soundRepository.getSounds();
  }

  async getSoundById(id: string): Promise<Sound | undefined> {
    return await soundRepository.getSoundById(id);
  }

  async getFavoriteSounds(): Promise<Sound[]> {
    return await soundRepository.getFavoriteSounds();
  }

  async addFavoriteSound(sound: Sound): Promise<void> {
    await soundRepository.addFavoriteSound(sound);
  }

  async removeFavoriteSound(soundId: string): Promise<void> {
    await soundRepository.removeFavoriteSound(soundId);
  }

  async isSoundFavorite(soundId: string): Promise<boolean> {
    return await soundRepository.isSoundFavorite(soundId);
  }
}

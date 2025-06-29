import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Sound } from '../models/Sound';
import { trackEvent } from '../utils/analytics';

export const useSoundPlayer = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const playSound = async (soundItem: Sound) => {
    // If a sound is already playing, stop it first
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    
    // If the pressed sound is the one already playing, it effectively pauses it
    if (currentSound?.id === soundItem.id && isPlaying) {
      setIsPlaying(false);
      setCurrentSound(null);
      setPlaybackProgress(0);
      setTotalDuration(0);
      return;
    }
    
    try {
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: soundItem.url },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      setCurrentSound(soundItem);
      trackEvent('sound_played', { sound_id: soundItem.id, sound_name: soundItem.name });

      if (status.isLoaded) {
        setTotalDuration(status.durationMillis || 0);
      }

      newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.isLoaded) {
          setPlaybackProgress(playbackStatus.positionMillis);
          setTotalDuration(playbackStatus.durationMillis || 0);
          if (playbackStatus.didJustFinish) {
            setIsPlaying(false);
            setCurrentSound(null);
            setPlaybackProgress(0);
            setTotalDuration(0);
            sound?.unloadAsync();
          }
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      setIsPlaying(false);
      setCurrentSound(null);
      setPlaybackProgress(0);
      setTotalDuration(0);
    }
  };

  const pauseSound = async () => {
    if (sound && isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setCurrentSound(null);
      setPlaybackProgress(0);
      setTotalDuration(0);
    }
  };

  useEffect(() => {
    // Unload the sound when the component unmounts
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return { playSound, pauseSound, stopSound, isPlaying, currentSound, playbackProgress, totalDuration };
};

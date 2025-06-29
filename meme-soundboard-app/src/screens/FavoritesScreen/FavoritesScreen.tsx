import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { soundApi } from '../../api/soundApi';
import { Sound } from '../../models/Sound';
import SoundList from '../../components/SoundList';
import { useSoundPlayer } from '../../hooks/useSoundPlayer';
import { trackEvent } from '../../utils/analytics';

const FavoritesScreen = () => {
  const { user } = useAuth();
  const [favoritedSounds, setFavoritedSounds] = useState<Sound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playSound, isPlaying, currentSound } = useSoundPlayer();

  const fetchFavoritedSounds = useCallback(async () => {
    if (!user) {
      setError('Authentication required.');
      setIsLoading(false);
      trackEvent('fetch_favorites_unauthenticated_attempt');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const { soundIds } = await soundApi.fetchFavoritedSoundIds(token);

      if (soundIds.length > 0) {
        const { sounds } = await soundApi.getSoundsByIds(soundIds, token);
        setFavoritedSounds(sounds);
        trackEvent('fetch_favorites_success', { count: sounds.length });
      } else {
        setFavoritedSounds([]);
        trackEvent('fetch_favorites_no_sounds');
      }
    } catch (err: any) {
      console.error("Error fetching favorited sounds:", err);
      setError(err.message || 'Failed to load favorited sounds.');
      setFavoritedSounds([]);
      trackEvent('fetch_favorites_error', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavoritedSounds();
    trackEvent('favorites_screen_view');
  }, [fetchFavoritedSounds]);

  const handleUnfavoriteSound = async (soundId: string) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to unfavorite sounds.');
      trackEvent('unfavorite_sound_unauthenticated_attempt', { soundId });
      return;
    }
    try {
      const token = await user.getIdToken();
      await soundApi.unfavoriteSound(soundId, token);
      Alert.alert('Success', 'Sound unfavorited.');
      trackEvent('unfavorite_sound_success', { soundId });
      // Refresh the list of favorited sounds
      fetchFavoritedSounds();
    } catch (err: any) {
      console.error('Error unfavoriting sound:', err);
      Alert.alert('Error', `Failed to unfavorite sound: ${err.message || 'Unknown error'}`);
      trackEvent('unfavorite_sound_error', { soundId, error: err.message });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.messageText}>Loading favorites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {favoritedSounds.length === 0 ? (
        <Text style={styles.messageText}>No favorited sounds yet.</Text>
      ) : (
        <SoundList
          sounds={favoritedSounds}
          onPressSound={playSound}
          currentlyPlayingSoundId={isPlaying ? currentSound?.id : undefined}
          onPressFavorite={handleUnfavoriteSound} // Pass unfavorite handler to SoundCard
          isFavoriteIconFilled={() => true} // All sounds here are favorited
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default FavoritesScreen;

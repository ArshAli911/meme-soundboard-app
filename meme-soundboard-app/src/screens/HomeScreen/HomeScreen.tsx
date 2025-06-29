import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, Button, Alert, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SoundList from '../../components/SoundList';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useSoundStore } from '../../store/soundSlice';
import { useSoundPlayer } from '../../hooks/useSoundPlayer';
import { soundRemoteSource } from '../../data/remote/soundRemoteSource';
import { logger } from '../../utils/logger';
import { Sound } from '../../models/Sound';
import { useAuth } from '../../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { CATEGORIES } from '../../constants/categories';
import { trackEvent } from '../../utils/analytics';

// MOCK_SOUNDS is no longer needed as we will fetch from remote source

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const { sounds, setSounds } = useSoundStore();
  const { playSound, isPlaying, currentSound } = useSoundPlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAndSetSounds = useCallback(async (category?: string, searchName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user) {
        setError('Authentication required');
        trackEvent('fetch_sounds_unauthenticated_attempt');
        return;
      }
      const token = await user.getIdToken();
      const result = await soundRemoteSource.fetchSounds({ category, searchName }, token);
      setSounds(result.sounds);
      trackEvent('fetch_sounds_success', { category: category || 'All', searchName: searchName || 'None', count: result.sounds.length });
    } catch (err: any) {
      logger.error("Failed to fetch or search sounds:", err);
      setError(err.message || 'Failed to load sounds');
      trackEvent('fetch_sounds_error', { category: category || 'All', searchName: searchName || 'None', error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [setSounds, user]);

  useEffect(() => {
    // Debounce effect for search and category changes
    const handler = setTimeout(() => {
      trackEvent('home_screen_view', { category: selectedCategory, searchQuery });
      fetchAndSetSounds(selectedCategory === 'All Categories' ? undefined : selectedCategory, searchQuery);
    }, 300); // Debounce time

    return () => clearTimeout(handler);
  }, [fetchAndSetSounds, selectedCategory, searchQuery]);

  const handleTranscodeAudio = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please log in to enqueue a transcoding job.");
      trackEvent('enqueue_transcode_unauthenticated_attempt');
      return;
    }
    // Simulate transcoding the first sound from the list
    if (sounds.length > 0) {
      const soundToTranscode = sounds[0];
      try {
        const token = await user.getIdToken();
        trackEvent('enqueue_transcode_started', { soundId: soundToTranscode.id, soundName: soundToTranscode.name });
        const result = await soundRemoteSource.enqueueTranscodeJob(
          soundToTranscode.name,
          soundToTranscode.url,
          token
        );
        Alert.alert("Job Enqueued", `Transcoding job ${result.jobId} for ${soundToTranscode.name} started in the background.`);
        trackEvent('enqueue_transcode_success', { soundId: soundToTranscode.id, jobId: result.jobId });
      } catch (err: any) {
        logger.error("Failed to enqueue transcode job:", err);
        Alert.alert("Error", `Failed to enqueue transcoding job: ${err.message}`);
        trackEvent('enqueue_transcode_error', { soundId: soundToTranscode.id, error: err.message });
      }
    } else {
      Alert.alert("No Sounds", "No sounds available to transcode.");
      trackEvent('enqueue_transcode_no_sounds');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search sounds..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue: string) => {
            setSelectedCategory(itemValue);
            trackEvent('category_filter_applied', { category: itemValue });
          }}
          style={styles.picker}
        >
          <Picker.Item label="All Categories" value="All Categories" />
          {CATEGORIES.map((category: string) => (
            <Picker.Item key={category} label={category} value={category} />
          ))}
        </Picker>
      </View>

      <Button title="Enqueue Transcode Job" onPress={handleTranscodeAudio} />
      {isLoading ? (
        <Text style={styles.message}>Loading sounds...</Text>
      ) : error ? (
        <Text style={styles.message}>Error: {error}</Text>
      ) : (
        <SoundList
          sounds={sounds}
          onPressSound={playSound}
          currentlyPlayingSoundId={isPlaying ? currentSound?.id : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  pickerContainer: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default HomeScreen;
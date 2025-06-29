import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Sound } from '../models/Sound';
import * as Sharing from 'expo-sharing';
import { trackEvent } from '../utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

type Props = {
  sound: Sound;
  onPress: (sound: Sound) => void;
  isPlaying: boolean;
  onPressFavorite?: (soundId: string) => void;
  isFavoriteIconFilled?: (soundId: string) => boolean;
};

const SoundCard = ({ sound, onPress, isPlaying, onPressFavorite, isFavoriteIconFilled }: Props) => {
  const onShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available on this device.');
        return;
      }

      // Download the file to a local cache directory
      const fileUri = FileSystem.cacheDirectory + sound.name + '.mp3';
      await FileSystem.downloadAsync(sound.url, fileUri);

      // Share the local file
      await Sharing.shareAsync(fileUri, { dialogTitle: `Share ${sound.name}` });
      trackEvent('sound_shared', { sound_id: sound.id, sound_name: sound.name });
    } catch (error: any) {
      console.error('Error sharing sound:', error);
      Alert.alert('Failed to share sound.');
      trackEvent('sound_share_error', { sound_id: sound.id, sound_name: sound.name, error: error.message });
    }
  };

  const handleFavoritePress = () => {
    if (onPressFavorite) {
      onPressFavorite(sound.id);
      const eventName = isFavoriteIconFilled && isFavoriteIconFilled(sound.id) ? 'sound_unfavorited' : 'sound_favorited';
      trackEvent(eventName, { sound_id: sound.id, sound_name: sound.name });
    }
  };

  const isFavorited = isFavoriteIconFilled ? isFavoriteIconFilled(sound.id) : false;

  return (
    <TouchableOpacity onPress={() => onPress(sound)} style={[styles.container, isPlaying && styles.playingContainer]}>
      {sound.imageUrl && (
        <Image source={{ uri: sound.imageUrl }} style={styles.soundImage} />
      )}
      <Text style={[styles.name, isPlaying && styles.playingName]}>{sound.name}</Text>
      {isPlaying && <ActivityIndicator color="#FFFFFF" />}
      <View style={styles.actionsContainer}>
        {onPressFavorite && (
          <TouchableOpacity onPress={handleFavoritePress} style={styles.favoriteButton}>
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={24}
              color={isFavorited ? "red" : "gray"}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onShare} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playingContainer: {
    backgroundColor: '#3498db',
  },
  name: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  playingName: {
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    marginRight: 10,
    padding: 5,
  },
  shareButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    marginLeft: 0,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  soundImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
});

export default SoundCard;

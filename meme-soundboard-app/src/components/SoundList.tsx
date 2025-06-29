import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Sound } from '../models/Sound';
import SoundCard from './SoundCard';

type Props = {
  sounds: Sound[];
  onPressSound: (sound: Sound) => void;
  currentlyPlayingSoundId?: string;
  onPressFavorite?: (soundId: string) => void;
  isFavoriteIconFilled?: (soundId: string) => boolean;
};

const SoundList = ({ sounds, onPressSound, currentlyPlayingSoundId, onPressFavorite, isFavoriteIconFilled }: Props) => {
  return (
    <FlatList
      data={sounds}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SoundCard
          sound={item}
          onPress={onPressSound}
          isPlaying={item.id === currentlyPlayingSoundId}
          onPressFavorite={onPressFavorite}
          isFavoriteIconFilled={isFavoriteIconFilled}
        />
      )}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
});

export default SoundList;

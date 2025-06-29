import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSoundPlayer } from '../hooks/useSoundPlayer';
import { Ionicons } from '@expo/vector-icons'; // Assuming expo-vector-icons is installed
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type PlayerBarNavigationProp = StackNavigationProp<RootStackParamList, 'Player'>;

const PlayerBar = () => {
  const { currentSound, isPlaying, playSound, pauseSound, stopSound } = useSoundPlayer();
  const navigation = useNavigation<PlayerBarNavigationProp>();

  if (!currentSound) {
    return null; // Don't render if no sound is playing
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSound();
    } else {
      // Re-play the current sound if it was paused
      playSound(currentSound); 
    }
  };

  const handlePressBar = () => {
    if (currentSound) {
      navigation.navigate('Player', { sound: currentSound });
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePressBar}>
      <View style={styles.leftSection}>
        <Text style={styles.soundName} numberOfLines={1}>{currentSound.name}</Text>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.controlButton}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={stopSound} style={styles.controlButton}>
          <Ionicons name="stop" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  leftSection: {
    flex: 1,
    marginRight: 10,
  },
  soundName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
});

export default PlayerBar;

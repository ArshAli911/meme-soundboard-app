import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useSoundPlayer } from '../../hooks/useSoundPlayer';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider'; // Assuming this library will be installed
import { formatTime } from '../../utils/formatTime';
import { Audio } from 'expo-av';
import { trackEvent } from '../../utils/analytics';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;

type Props = {
  route: PlayerScreenRouteProp;
};

const PlayerScreen = ({ route }: Props) => {
  const { currentSound, isPlaying, playbackProgress, totalDuration, playSound, pauseSound, stopSound } = useSoundPlayer();

  // Ensure we are displaying the sound from the global player state, not just route params
  // This makes sure the screen updates even if the sound changes from PlayerBar or elsewhere
  const soundToDisplay = currentSound;

  useEffect(() => {
    if (soundToDisplay) {
      trackEvent('player_screen_view', { soundId: soundToDisplay.id, soundName: soundToDisplay.name });
    }
  }, [soundToDisplay]);

  if (!soundToDisplay) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>No sound currently playing.</Text>
      </View>
    );
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSound();
      trackEvent('player_pause_button_pressed', { soundId: soundToDisplay.id });
    } else {
      // If sound was paused, play it from current position. If new sound, play from start.
      if (soundToDisplay) {
        playSound(soundToDisplay);
        trackEvent('player_play_button_pressed', { soundId: soundToDisplay.id });
      }
    }
  };

  const handleSliderComplete = async (value: number) => {
    if (soundToDisplay && soundToDisplay.url && soundToDisplay.id) {
      trackEvent('player_seek_action', { soundId: soundToDisplay.id, seekTo: value });
      // Re-create sound and seek to position for seeking functionality
      // This is a simplification; a more robust solution would manage the Sound object within useSoundPlayer
      // to allow direct seeking without re-creating.
      stopSound(); // Stop existing sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: soundToDisplay.url },
        { shouldPlay: false }
      );
      await newSound.setPositionAsync(value);
      await newSound.playAsync();
      // Manually update useSoundPlayer state if needed, or pass the new sound instance back.
      // For this example, we'll rely on useSoundPlayer's internal status updates.
    }
  };

  const handleStop = () => {
    stopSound();
    trackEvent('player_stop_button_pressed', { soundId: soundToDisplay.id });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{soundToDisplay.name}</Text>
      <Text style={styles.category}>{soundToDisplay.category}</Text>

      <View style={styles.controlsContainer}>
        <Text style={styles.timeText}>{formatTime(playbackProgress)}</Text>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={totalDuration}
          value={playbackProgress}
          onSlidingComplete={handleSliderComplete}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
          thumbTintColor="#FFFFFF"
        />
        <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
      </View>

      <View style={styles.playbackButtons}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.controlButton}>
          <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={80} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleStop} style={styles.controlButton}>
          <Ionicons name="stop-circle" size={80} color="white" />
        </TouchableOpacity>
      </View>

      {/* Add more sound details here, e.g., tags, uploader, etc. */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 20,
  },
  messageText: {
    color: 'white',
    fontSize: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  category: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 30,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  timeText: {
    color: 'white',
    fontSize: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  playbackButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  controlButton: {
    marginHorizontal: 20,
  },
});

export default PlayerScreen;

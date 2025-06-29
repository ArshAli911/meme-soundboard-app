import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Image, Alert, TextInput, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import { soundApi } from '../../api/soundApi';
import { CATEGORIES } from '../../constants/categories';
import { trackEvent } from '../../utils/analytics';

const UploadScreen = () => {
  const { user } = useAuth();
  const [soundName, setSoundName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0] || '');
  const [selectedAudio, setSelectedAudio] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAudio(result.assets[0]);
        setUploadStatus('idle');
        setUploadProgress(0);
        trackEvent('audio_file_selected', { fileName: result.assets[0].name });
      } else if (result.canceled) {
        console.log('Document picking cancelled');
        trackEvent('audio_file_selection_cancelled');
      }
    } catch (error: any) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick audio file.');
      trackEvent('audio_file_selection_error', { error: error.message || 'Unknown error' });
    }
  };

  const uploadSound = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to upload sounds.');
      trackEvent('upload_sound_unauthenticated_attempt');
      return;
    }

    const token = await user.getIdToken();

    if (!soundName.trim()) {
      Alert.alert('Validation', 'Please enter a sound name.');
      trackEvent('upload_sound_validation_error', { field: 'soundName' });
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Validation', 'Please select a category.');
      trackEvent('upload_sound_validation_error', { field: 'selectedCategory' });
      return;
    }
    if (!selectedAudio) {
      Alert.alert('Validation', 'Please select an audio file.');
      trackEvent('upload_sound_validation_error', { field: 'selectedAudio' });
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    trackEvent('upload_sound_started', { soundName, selectedCategory });

    try {
      // Read file as base64
      const fileUri = selectedAudio.uri;
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',' )[1]; // Get only the base64 content

        const soundData = {
          name: soundName.trim(),
          category: selectedCategory,
          tags: [], // You can add a UI for tags later if needed
          fileName: selectedAudio.name || `sound_${Date.now()}.mp3`,
          contentType: selectedAudio.mimeType || 'audio/mpeg',
          fileBase64: base64Content,
        };

        try {
          const uploadResponse = await soundApi.uploadSoundFile(soundData, token);
          if (uploadResponse.status === 'success') {
            Alert.alert('Success', 'Sound uploaded successfully!');
            setUploadStatus('success');
            trackEvent('upload_sound_success', { soundName, category: selectedCategory });
            // Reset form
            setSoundName('');
            setSelectedCategory(CATEGORIES[0] || '');
            setSelectedAudio(null);
            setUploadProgress(0);
          } else {
            Alert.alert('Upload Failed', uploadResponse.message || 'Unknown error occurred.');
            setUploadStatus('error');
            trackEvent('upload_sound_failed', { soundName, category: selectedCategory, message: uploadResponse.message });
          }
        } catch (apiError: any) {
          console.error('Error uploading sound via API:', apiError);
          Alert.alert('Upload Failed', 'An error occurred during upload.');
          setUploadStatus('error');
          trackEvent('upload_sound_api_error', { soundName, category: selectedCategory, error: apiError.message || 'Unknown API error' });
        }
      };
      reader.onerror = (e: ProgressEvent<FileReader>) => {
        console.error('FileReader error:', e);
        Alert.alert('Error', 'Failed to read audio file.');
        setUploadStatus('error');
        trackEvent('upload_sound_file_read_error', { error: e.toString() });
      };

    } catch (error: any) {
      console.error('Error during sound upload process:', error);
      Alert.alert('Upload Failed', 'An error occurred during sound upload.');
      setUploadStatus('error');
      trackEvent('upload_sound_general_error', { error: error.message || 'Unknown general error' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload New Sound</Text>

      <TextInput
        style={styles.input}
        placeholder="Sound Name"
        value={soundName}
        onChangeText={setSoundName}
      />

      <View style={styles.pickerContainer}>
        {/* @ts-ignore */}
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue: string) => setSelectedCategory(itemValue)}
          style={styles.picker}
        >
          {CATEGORIES.map((category: string) => (
            <Picker.Item key={category} label={category} value={category} />
          ))}
        </Picker>
      </View>

      <Button title="Pick Audio File" onPress={pickAudio} />
      {selectedAudio && (
        <Text style={styles.fileName}>Selected: {selectedAudio.name}</Text>
      )}

      <Button
        title={uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Sound'}
        onPress={uploadSound}
        disabled={uploadStatus === 'uploading' || !selectedAudio}
      />

      {uploadStatus === 'uploading' && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Uploading: {uploadProgress.toFixed(0)}%</Text>
        </View>
      )}

      {uploadStatus === 'success' && (
        <Text style={styles.statusTextSuccess}>Upload Complete!</Text>
      )}

      {uploadStatus === 'error' && (
        <Text style={styles.statusTextError}>Upload Failed.</Text>
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
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    width: '100%',
  },
  fileName: {
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  statusTextSuccess: {
    marginTop: 20,
    color: 'green',
    fontWeight: 'bold',
  },
  statusTextError: {
    marginTop: 20,
    color: 'red',
    fontWeight: 'bold',
  },
});

export default UploadScreen;

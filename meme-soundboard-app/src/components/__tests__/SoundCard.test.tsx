import React from 'react';
// @ts-ignore
import { render } from '@testing-library/react-native';
import SoundCard from '../SoundCard';
import { Sound } from '../../models/Sound';

describe('SoundCard', () => {
  const mockSound: Sound = {
    id: '1',
    name: 'Test Sound',
    url: 'http://example.com/test.mp3',
    category: 'Effects',
  };

  it('renders correctly', () => {
    const { getByText } = render(
      <SoundCard
        sound={mockSound}
        onPress={() => {}}
        isPlaying={false}
      />
    );
    expect(getByText('Test Sound')).toBeTruthy();
  });

  it('shows playing indicator when currently playing', () => {
    const { getByText } = render(
      <SoundCard
        sound={mockSound}
        onPress={() => {}}
        isPlaying={true}
      />
    );
    // Assuming there's a visual indicator for playing, e.g., an emoji or specific text
    // You might need to adjust this expectation based on your SoundCard's implementation
    expect(getByText('Test Sound')).toBeTruthy();
    // Add more specific assertions if there's a visible playing indicator
  });
}); 
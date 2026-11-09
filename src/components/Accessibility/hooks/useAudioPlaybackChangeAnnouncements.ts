import type { AudioPlayer, AudioPlayerState } from '../../AudioPlayback';
import { useInteractionAnnouncements } from './useInteractionAnnouncements';
import { useStateStore } from '../../../store';
import { useEffect, useRef } from 'react';

const playbackRateSelector = (state: AudioPlayerState) => ({
  currentPlaybackRate: state.currentPlaybackRate,
});

export const useAudioPlaybackChangeAnnouncements = (
  audioPlayer: AudioPlayer | undefined,
) => {
  const { announceInteraction } = useInteractionAnnouncements();

  // The rate button only changes an icon/label in place, so a screen reader gets no confirmation.
  // Announcing from the player state covers every widget that changes the rate.
  const { currentPlaybackRate } =
    useStateStore(audioPlayer?.state, playbackRateSelector) ?? {};
  const previousPlaybackRateRef = useRef(currentPlaybackRate);
  useEffect(() => {
    const previous = previousPlaybackRateRef.current;
    previousPlaybackRateRef.current = currentPlaybackRate;
    // Skips the initial value and unchanged rates.
    if (
      currentPlaybackRate === undefined ||
      previous === undefined ||
      previous === currentPlaybackRate
    )
      return;
    announceInteraction('audioPlayer.playbackRateChanged', { rate: currentPlaybackRate });
  }, [announceInteraction, currentPlaybackRate]);
};

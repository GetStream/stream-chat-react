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

  // Announce a playback-speed change to assistive tech. The rate button only changes an icon/label
  // in place, so a screen reader gets no confirmation; announce off the state so it reflects the new
  // rate regardless of which widget's button was pressed (voice recording or audio attachment).
  const { currentPlaybackRate } =
    useStateStore(audioPlayer?.state, playbackRateSelector) ?? {};
  const previousPlaybackRateRef = useRef(currentPlaybackRate);
  useEffect(() => {
    const previous = previousPlaybackRateRef.current;
    previousPlaybackRateRef.current = currentPlaybackRate;
    // Skip the initial value and no-op re-renders; announce only a real change to a defined rate.
    if (
      currentPlaybackRate === undefined ||
      previous === undefined ||
      previous === currentPlaybackRate
    )
      return;
    announceInteraction('audioPlayer.playbackRateChanged', { rate: currentPlaybackRate });
  }, [announceInteraction, currentPlaybackRate]);
};

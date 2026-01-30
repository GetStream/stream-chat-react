import React, { useEffect } from 'react';
import { PauseIcon, PlayIcon } from '../../MessageInput/icons';
import { RecordingTimer } from './RecordingTimer';
import { WaveProgressBar } from '../../Attachment';
import { type AudioPlayerState, useAudioPlayer } from '../../AudioPlayback';
import { useStateStore } from '../../../store';

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  isPlaying: state.isPlaying,
  progress: state.progressPercent,
  secondsElapsed: state.secondsElapsed,
});

export type AudioRecordingPlayerProps = {
  durationSeconds: number;
  mimeType?: string;
  src?: string;
  waveformData?: number[];
};

export const AudioRecordingPreview = ({
  durationSeconds,
  mimeType,
  src,
  waveformData,
}: AudioRecordingPlayerProps) => {
  const audioPlayer = useAudioPlayer({
    durationSeconds,
    mimeType,
    src,
    waveformData,
  });

  const { isPlaying, progress, secondsElapsed } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  const displayedDuration = secondsElapsed || durationSeconds;

  useEffect(() => {
    audioPlayer?.cancelScheduledRemoval();
    return () => {
      audioPlayer?.scheduleRemoval();
    };
  }, [audioPlayer]);

  if (!audioPlayer) return;

  return (
    <React.Fragment>
      <button
        className='str-chat__audio_recorder__toggle-playback-button'
        data-testid='audio-recording-preview-toggle-play-btn'
        onClick={audioPlayer.togglePlay}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <RecordingTimer durationSeconds={displayedDuration} />
      <div className='str-chat__wave-progress-bar__track-container'>
        <WaveProgressBar
          amplitudesCount={35}
          progress={progress}
          seek={audioPlayer.seek}
          waveformData={waveformData || []}
        />
      </div>
    </React.Fragment>
  );
};

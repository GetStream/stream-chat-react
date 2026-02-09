import React, { useEffect } from 'react';
import { WaveProgressBar } from '../../Attachment';
import {
  type AudioPlayerState,
  DurationDisplay,
  useAudioPlayer,
} from '../../AudioPlayback';
import { useStateStore } from '../../../store';
import { IconPause, IconPlaySolid } from '../../Icons';
import { Button } from '../../Button';
import clsx from 'clsx';

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

export const AudioRecordingPlayback = ({
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
    <div
      className={clsx('str-chat__audio-recorder__recording-playback', {
        'str-chat__audio-recorder__recording-playback--isPlaying': isPlaying,
      })}
    >
      <Button
        className={clsx(
          'str-chat__audio_recorder__toggle-playback-button',
          'str-chat__button--secondary',
          'str-chat__button--ghost',
          'str-chat__button--size-sm',
          'str-chat__button--circular',
        )}
        data-testid='audio-recording-preview-toggle-play-btn'
        onClick={audioPlayer.togglePlay}
      >
        {isPlaying ? <IconPause /> : <IconPlaySolid />}
      </Button>
      <DurationDisplay
        className={clsx('str-chat__recording-timer', {
          'str-chat__recording-timer--hours': displayedDuration >= 3600,
        })}
        duration={durationSeconds}
        isPlaying={!!isPlaying}
        secondsElapsed={secondsElapsed}
      />
      <div className='str-chat__wave-progress-bar__track-container'>
        <WaveProgressBar
          progress={progress}
          seek={audioPlayer.seek}
          waveformData={waveformData || []}
        />
      </div>
    </div>
  );
};

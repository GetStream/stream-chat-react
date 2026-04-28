import React, { useEffect } from 'react';
import { DurationDisplay, WaveProgressBar } from '../../AudioPlayback';
import type { AudioPlayerState } from '../../AudioPlayback/AudioPlayer';
import { useAudioPlayer } from '../../AudioPlayback/WithAudioPlayback';
import { useStateStore } from '../../../store';
import { IconPauseFill, IconPlayFill } from '../../Icons';
import { Button } from '../../Button';
import { useTranslationContext } from '../../../context';
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
  const { t } = useTranslationContext();
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
        appearance='ghost'
        aria-label={isPlaying ? t('aria/Pause') : t('aria/Play')}
        circular
        className='str-chat__audio_recorder__toggle-playback-button'
        data-testid='audio-recording-preview-toggle-play-btn'
        onClick={audioPlayer.togglePlay}
        size='sm'
        variant='secondary'
      >
        {isPlaying ? <IconPauseFill /> : <IconPlayFill />}
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
          durationSeconds={durationSeconds}
          progress={progress}
          secondsElapsed={secondsElapsed}
          seek={audioPlayer.seek}
          waveformData={waveformData || []}
        />
      </div>
    </div>
  );
};

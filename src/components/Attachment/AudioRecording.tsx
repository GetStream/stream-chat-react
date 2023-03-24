import React from 'react';
import type { Attachment } from 'stream-chat';
import { FileIcon } from 'react-file-utils';

import { FileSizeIndicator, PlaybackRateButton, PlayButton, WaveProgressBar } from './components';
import { useAudioController } from './hooks/useAudioController';
import { secondsToTime } from './utils';
import { useTranslationContext } from '../../context';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type AudioRecordingProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The attachment object from the message's attachment list. */
  attachment: Attachment<StreamChatGenerics>;
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
};

export const AudioRecordingPlayer = ({ attachment, playbackRates }: AudioRecordingProps) => {
  const { t } = useTranslationContext('AudioRecording');
  const {
    asset_url,
    duration,
    mime_type,
    title = t<string>('Voice message'),
    waveList,
  } = attachment;

  const {
    audioRef,
    increasePlaybackRate,
    isPlaying,
    playbackRate,
    progress,
    secondsElapsed,
    seek,
    togglePlay,
  } = useAudioController({
    durationSeconds: duration ? duration / 1000 : 0,
    playbackRates,
  });

  if (!asset_url) return null;

  const dataTestId = 'audio-recording-widget';
  const rootClassName = 'str-chat__message-attachment__audio-recording-widget';

  return (
    <div className={rootClassName} data-testid={dataTestId}>
      <audio ref={audioRef}>
        <source data-testid='audio-source' src={asset_url} type='audio/mp3' />
      </audio>
      <PlayButton isPlaying={isPlaying} onClick={togglePlay} />
      <div className='str-chat__message-attachment__audio-recording-widget__middle-section'>
        {title && (
          <div
            className='str-chat__message-attachment__audio-recording-widget__title'
            data-testid='audio-recording-title'
            title={title}
          >
            {title}
          </div>
        )}
        <div className='str-chat__message-attachment__audio-recording-widget__audio-state'>
          <div className='str-chat__message-attachment__audio-recording-widget__timer'>
            {attachment.duration ? (
              secondsToTime(secondsElapsed)
            ) : (
              <FileSizeIndicator fileSize={attachment.file_size} maximumFractionDigits={0} />
            )}
          </div>
          <WaveProgressBar onClick={seek} progress={progress} waveList={waveList || []} />
        </div>
      </div>
      <div className='str-chat__message-attachment__audio-recording-widget__right-section'>
        {isPlaying ? (
          <PlaybackRateButton disabled={!audioRef.current} onClick={increasePlaybackRate}>
            {playbackRate.toFixed(1)}x
          </PlaybackRateButton>
        ) : (
          <FileIcon big={true} mimeType={mime_type} size={40} version={'2'} />
        )}
      </div>
    </div>
  );
};

export const AudioRecording = React.memo(AudioRecordingPlayer) as typeof AudioRecordingPlayer;

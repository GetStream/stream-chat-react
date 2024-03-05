import React from 'react';
import type { Attachment } from 'stream-chat';

import { FileSizeIndicator, PlaybackRateButton, PlayButton, WaveProgressBar } from './components';
import { useAudioController } from './hooks/useAudioController';
import { displayDuration } from './utils';
import { FileIcon } from '../ReactFileUtilities';
import { useTranslationContext } from '../../context';

import type { DefaultStreamChatGenerics } from '../../types';

const rootClassName = 'str-chat__message-attachment__audio-recording-widget';

type AudioRecordingPlayerProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<AudioRecordingProps<StreamChatGenerics>, 'attachment'> & {
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
};

export const AudioRecordingPlayer = ({ attachment, playbackRates }: AudioRecordingPlayerProps) => {
  const { t } = useTranslationContext('AudioRecording');
  const {
    asset_url,
    duration,
    mime_type,
    title = t<string>('Voice message'),
    waveform_data,
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
    durationSeconds: duration ?? 0,
    playbackRates,
  });

  if (!asset_url) return null;

  return (
    <div className={rootClassName} data-testid='audio-recording-widget'>
      <audio ref={audioRef}>
        <source data-testid='audio-source' src={asset_url} type={mime_type} />
      </audio>
      <PlayButton isPlaying={isPlaying} onClick={togglePlay} />
      <div className='str-chat__message-attachment__audio-recording-widget__metadata'>
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
              displayDuration(secondsElapsed)
            ) : (
              <FileSizeIndicator fileSize={attachment.file_size} maximumFractionDigits={0} />
            )}
          </div>
          <WaveProgressBar onClick={seek} progress={progress} waveformData={waveform_data || []} />
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

export type QuotedAudioRecordingProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<AudioRecordingProps<StreamChatGenerics>, 'attachment'>;

export const QuotedAudioRecording = ({ attachment }: QuotedAudioRecordingProps) => {
  const { t } = useTranslationContext();
  const title = attachment.title || t<string>('Voice message');
  return (
    <div className={rootClassName} data-testid='quoted-audio-recording-widget'>
      <div className='str-chat__message-attachment__audio-recording-widget__metadata'>
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
              displayDuration(attachment.duration)
            ) : (
              <FileSizeIndicator fileSize={attachment.file_size} maximumFractionDigits={0} />
            )}
          </div>
        </div>
      </div>
      <FileIcon big={true} mimeType={attachment.mime_type} size={34} version={'2'} />
    </div>
  );
};

export type AudioRecordingProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The attachment object from the message's attachment list. */
  attachment: Attachment<StreamChatGenerics>;
  /** A boolean flag to signal whether the attachment will be rendered inside the quoted reply. */
  isQuoted?: boolean;
};

const UnMemoizedAudioRecording = ({ attachment, isQuoted }: AudioRecordingProps) =>
  isQuoted ? (
    <QuotedAudioRecording attachment={attachment} />
  ) : (
    <AudioRecordingPlayer attachment={attachment} />
  );

export const AudioRecording = React.memo(
  UnMemoizedAudioRecording,
) as typeof UnMemoizedAudioRecording;

import React from 'react';
import type { Attachment } from 'stream-chat';

import {
  FileSizeIndicator,
  PlaybackRateButton,
  PlayButton,
  WaveProgressBar,
} from './components';
import { useAudioController } from './hooks/useAudioController';
import { displayDuration } from './utils';
import { FileIcon } from '../ReactFileUtilities';
import { useTranslationContext } from '../../context';

const rootClassName = 'str-chat__message-attachment__voice-recording-widget';

export type VoiceRecordingPlayerProps = Pick<VoiceRecordingProps, 'attachment'> & {
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
};

export const VoiceRecordingPlayer = ({
  attachment,
  playbackRates,
}: VoiceRecordingPlayerProps) => {
  const { t } = useTranslationContext('VoiceRecordingPlayer');
  const {
    asset_url,
    duration = 0,
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
    mimeType: mime_type,
    playbackRates,
  });

  if (!asset_url) return null;

  const displayedDuration = secondsElapsed || duration;

  return (
    <div className={rootClassName} data-testid='voice-recording-widget'>
      <audio ref={audioRef}>
        <source data-testid='audio-source' src={asset_url} type={mime_type} />
      </audio>
      <PlayButton isPlaying={isPlaying} onClick={togglePlay} />
      <div className='str-chat__message-attachment__voice-recording-widget__metadata'>
        <div
          className='str-chat__message-attachment__voice-recording-widget__title'
          data-testid='voice-recording-title'
          title={title}
        >
          {title}
        </div>
        <div className='str-chat__message-attachment__voice-recording-widget__audio-state'>
          <div className='str-chat__message-attachment__voice-recording-widget__timer'>
            {attachment.duration ? (
              displayDuration(displayedDuration)
            ) : (
              <FileSizeIndicator
                fileSize={attachment.file_size}
                maximumFractionDigits={0}
              />
            )}
          </div>
          <WaveProgressBar
            progress={progress}
            seek={seek}
            waveformData={waveform_data || []}
          />
        </div>
      </div>
      <div className='str-chat__message-attachment__voice-recording-widget__right-section'>
        {isPlaying ? (
          <PlaybackRateButton disabled={!audioRef.current} onClick={increasePlaybackRate}>
            {playbackRate.toFixed(1)}x
          </PlaybackRateButton>
        ) : (
          <FileIcon big={true} mimeType={mime_type} size={40} />
        )}
      </div>
    </div>
  );
};

export type QuotedVoiceRecordingProps = Pick<VoiceRecordingProps, 'attachment'>;

export const QuotedVoiceRecording = ({ attachment }: QuotedVoiceRecordingProps) => {
  const { t } = useTranslationContext();
  const title = attachment.title || t<string>('Voice message');
  return (
    <div className={rootClassName} data-testid='quoted-voice-recording-widget'>
      <div className='str-chat__message-attachment__voice-recording-widget__metadata'>
        {title && (
          <div
            className='str-chat__message-attachment__voice-recording-widget__title'
            data-testid='voice-recording-title'
            title={title}
          >
            {title}
          </div>
        )}
        <div className='str-chat__message-attachment__voice-recording-widget__audio-state'>
          <div className='str-chat__message-attachment__voice-recording-widget__timer'>
            {attachment.duration ? (
              displayDuration(attachment.duration)
            ) : (
              <FileSizeIndicator
                fileSize={attachment.file_size}
                maximumFractionDigits={0}
              />
            )}
          </div>
        </div>
      </div>
      <FileIcon big={true} mimeType={attachment.mime_type} size={34} />
    </div>
  );
};

export type VoiceRecordingProps = {
  /** The attachment object from the message's attachment list. */
  attachment: Attachment;
  /** A boolean flag to signal whether the attachment will be rendered inside the quoted reply. */
  isQuoted?: boolean;
};

export const VoiceRecording = ({ attachment, isQuoted }: VoiceRecordingProps) =>
  isQuoted ? (
    <QuotedVoiceRecording attachment={attachment} />
  ) : (
    <VoiceRecordingPlayer attachment={attachment} />
  );

import React from 'react';
import type { Attachment } from 'stream-chat';

import {
  FileSizeIndicator,
  PlaybackRateButton,
  PlayButton,
  WaveProgressBar,
} from './components';
import { displayDuration } from './utils';
import { FileIcon } from '../ReactFileUtilities';
import { useMessageContext, useTranslationContext } from '../../context';
import { useAudioPlayer } from '../AudioPlayer/WithAudioPlayback';
import { useStateStore } from '../../store';
import type { AudioPlayerState } from '../AudioPlayer/AudioPlayer';

const rootClassName = 'str-chat__message-attachment__voice-recording-widget';

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  canPlayRecord: state.canPlayRecord,
  isPlaying: state.isPlaying,
  playbackRate: state.currentPlaybackRate,
  progress: state.progressPercent,
  secondsElapsed: state.secondsElapsed,
});

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
    title = t('Voice message'),
    waveform_data,
  } = attachment;

  /**
   * Introducing message context. This could be breaking change, therefore the fallback to {} is provided.
   * If this component is used outside the message context, then there will be no audio player namespacing
   * => scrolling away from the message in virtualized ML would create a new AudioPlayer instance.
   *
   * Edge case: the requester (message) has multiple attachments with the same assetURL - does not happen
   * with the default SDK components, but can be done with custom API calls.In this case all the Audio
   * widgets will share the state.
   */
  const { message } = useMessageContext() ?? {};

  const audioPlayer = useAudioPlayer({
    durationSeconds: duration ?? 0,
    mimeType: mime_type,
    playbackRates,
    requester: message?.id && `${message.parent_id}${message.id}`,
    src: asset_url,
  });

  const { canPlayRecord, isPlaying, playbackRate, progress, secondsElapsed } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  if (!audioPlayer) return null;

  const displayedDuration = secondsElapsed || duration;

  return (
    <div className={rootClassName} data-testid='voice-recording-widget'>
      <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
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
            seek={audioPlayer.seek}
            waveformData={waveform_data || []}
          />
        </div>
      </div>
      <div className='str-chat__message-attachment__voice-recording-widget__right-section'>
        {isPlaying ? (
          <PlaybackRateButton
            disabled={!canPlayRecord}
            onClick={audioPlayer.increasePlaybackRate}
          >
            {playbackRate?.toFixed(1)}x
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
  const title = attachment.title || t('Voice message');
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

import React from 'react';
import type { Attachment } from 'stream-chat';

import { FileSizeIndicator, PlaybackRateButton, WaveProgressBar } from './components';
import { displayDuration } from './utils';
import { FileIcon } from '../FileIcon';
import { useMessageContext, useTranslationContext } from '../../context';
import { type AudioPlayerState, useAudioPlayer } from '../AudioPlayback/';
import { useStateStore } from '../../store';
import type { AudioPlayer } from '../AudioPlayback';
import { PlayButton } from '../Button';

const rootClassName = 'str-chat__message-attachment__voice-recording-widget';

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  canPlayRecord: state.canPlayRecord,
  isPlaying: state.isPlaying,
  playbackRate: state.currentPlaybackRate,
  progress: state.progressPercent,
  secondsElapsed: state.secondsElapsed,
});

type VoiceRecordingPlayerUIProps = {
  audioPlayer: AudioPlayer;
};

// todo: finish creating a BaseAudioPlayer derived from VoiceRecordingPlayerUI and AudioAttachmentUI
const VoiceRecordingPlayerUI = ({ audioPlayer }: VoiceRecordingPlayerUIProps) => {
  const { canPlayRecord, isPlaying, playbackRate, progress, secondsElapsed } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  const displayedDuration = secondsElapsed || audioPlayer.durationSeconds;

  return (
    <div className={rootClassName} data-testid='voice-recording-widget'>
      <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
      <div className='str-chat__message-attachment__voice-recording-widget__metadata'>
        {/*todo: should we be really removing the title?*/}
        {/*<div*/}
        {/*  className='str-chat__message-attachment__voice-recording-widget__title'*/}
        {/*  data-testid='voice-recording-title'*/}
        {/*  title={audioPlayer.title}*/}
        {/*>*/}
        {/*  {audioPlayer.title}*/}
        {/*</div>*/}
        <div className='str-chat__message-attachment__voice-recording-widget__audio-state'>
          <div className='str-chat__message-attachment__voice-recording-widget__timer'>
            {audioPlayer.durationSeconds ? (
              displayDuration(displayedDuration)
            ) : (
              <FileSizeIndicator
                fileSize={audioPlayer.fileSize}
                maximumFractionDigits={0}
              />
            )}
          </div>
          <WaveProgressBar
            // amplitudesCount={50}
            progress={progress}
            seek={audioPlayer.seek}
            waveformData={audioPlayer.waveformData || []}
          />
        </div>
      </div>
      <div className='str-chat__message-attachment__voice-recording-widget__right-section'>
        <PlaybackRateButton
          disabled={!canPlayRecord}
          onClick={audioPlayer.increasePlaybackRate}
        >
          {playbackRate?.toFixed(1)}x
        </PlaybackRateButton>
      </div>
    </div>
  );
};

export type VoiceRecordingPlayerProps = Pick<VoiceRecordingProps, 'attachment'> & {
  /** An array of fractional numeric values of playback speed to override the defaults (1.0, 1.5, 2.0) */
  playbackRates?: number[];
};

export const VoiceRecordingPlayer = ({
  attachment,
  playbackRates,
}: VoiceRecordingPlayerProps) => {
  const { t } = useTranslationContext();
  const {
    asset_url,
    duration = 0,
    file_size,
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
  const { message, threadList } = useMessageContext() ?? {};

  const audioPlayer = useAudioPlayer({
    durationSeconds: duration ?? 0,
    fileSize: file_size,
    mimeType: mime_type,
    playbackRates,
    requester:
      message?.id &&
      `${threadList ? (message.parent_id ?? message.id) : ''}${message.id}`,
    src: asset_url,
    title,
    waveformData: waveform_data,
  });

  return audioPlayer ? <VoiceRecordingPlayerUI audioPlayer={audioPlayer} /> : null;
};

export type QuotedVoiceRecordingProps = Pick<VoiceRecordingProps, 'attachment'>;

export const QuotedVoiceRecording = ({ attachment }: QuotedVoiceRecordingProps) => (
  // const { t } = useTranslationContext();
  // const title = attachment.title || t('Voice message');
  <div className={rootClassName} data-testid='quoted-voice-recording-widget'>
    <div className='str-chat__message-attachment__voice-recording-widget__metadata'>
      {/*{title && (*/}
      {/*  <div*/}
      {/*    className='str-chat__message-attachment__voice-recording-widget__title'*/}
      {/*    data-testid='voice-recording-title'*/}
      {/*    title={title}*/}
      {/*  >*/}
      {/*    {title}*/}
      {/*  </div>*/}
      {/*)}*/}
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
    <FileIcon mimeType={attachment.mime_type} />
  </div>
);

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

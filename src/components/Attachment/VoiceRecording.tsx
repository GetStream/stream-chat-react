import React, { useContext } from 'react';
import type { Attachment, VoiceRecordingAttachment } from 'stream-chat';

import {
  AttachmentUploadProgressIndicator as DefaultAttachmentUploadProgressIndicator,
  FileSizeIndicator as DefaultFileSizeIndicator,
} from './components';
import { FileIcon } from '../FileIcon';
import {
  MessageContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import {
  type AudioPlayer,
  type AudioPlayerState,
  DurationDisplay,
  PlaybackRateButton,
  WaveProgressBar,
} from '../AudioPlayback';
import { useAudioPlayer } from '../AudioPlayback/WithAudioPlayback';
import { useStateStore } from '../../store';
import { PlayButton } from '../Button';
import { useThreadContext } from '../Threads';
import { getAttachmentPreviewUrl } from 'stream-chat';
import { useAttachmentUploadState } from './hooks/useAttachmentUploadState';

const rootClassName = 'str-chat__message-attachment__voice-recording-widget';

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  canPlayRecord: state.canPlayRecord,
  durationSeconds: state.durationSeconds,
  isPlaying: state.isPlaying,
  playbackRate: state.currentPlaybackRate,
  progress: state.progressPercent,
  secondsElapsed: state.secondsElapsed,
});

type VoiceRecordingPlayerUIProps = {
  attachment?: Attachment;
  audioPlayer: AudioPlayer;
};

// todo: finish creating a BaseAudioPlayer derived from VoiceRecordingPlayerUI and AudioAttachmentUI
const VoiceRecordingPlayerUI = ({
  attachment,
  audioPlayer,
}: VoiceRecordingPlayerUIProps) => {
  const {
    AttachmentUploadProgressIndicator = DefaultAttachmentUploadProgressIndicator,
    FileSizeIndicator = DefaultFileSizeIndicator,
  } = useComponentContext();
  const { isUploading } = useAttachmentUploadState(attachment);
  const { t } = useTranslationContext();
  const {
    canPlayRecord,
    durationSeconds,
    isPlaying,
    playbackRate,
    progress,
    secondsElapsed,
  } = useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  return (
    <div className={rootClassName} data-testid='voice-recording-widget'>
      <div className='str-chat__message-attachment__voice-recording-widget__play-button-container'>
        <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />
      </div>
      <div className='str-chat__message-attachment__voice-recording-widget__metadata'>
        <div className='str-chat__message-attachment__voice-recording-widget__audio-state'>
          <div className='str-chat__message-attachment__voice-recording-widget__timer'>
            {/*
              While uploading, the upload progress takes this slot, ahead of the duration:
              `MediaRecorderController` stamps `duration` on every recording before upload, which
              would hide the upload state.
            */}
            {isUploading ? (
              <AttachmentUploadProgressIndicator attachment={attachment} />
            ) : durationSeconds ? (
              <DurationDisplay
                duration={durationSeconds}
                isPlaying={!!isPlaying}
                secondsElapsed={secondsElapsed}
                showRemaining
              />
            ) : (
              <FileSizeIndicator
                fileSize={audioPlayer.fileSize}
                maximumFractionDigits={0}
              />
            )}
          </div>
          <WaveProgressBar
            durationSeconds={durationSeconds}
            progress={progress}
            secondsElapsed={secondsElapsed}
            seek={audioPlayer.seek}
            waveformData={audioPlayer.waveformData || []}
          />
        </div>
      </div>
      <div className='str-chat__message-attachment__voice-recording-widget__right-section'>
        <PlaybackRateButton
          aria-label={t('common.playbackSpeedX.label', 'Playback speed {{ rate }}x', {
            rate: playbackRate?.toString() ?? '1',
          })}
          disabled={!canPlayRecord}
          onClick={audioPlayer.increasePlaybackRate}
        >
          x{playbackRate?.toString()}
        </PlaybackRateButton>
      </div>
    </div>
  );
};

export type VoiceRecordingPlayerProps = Pick<VoiceRecordingProps, 'attachment'> & {
  /** Playback speeds that replace the defaults (1.0, 1.5, 2.0). */
  playbackRates?: number[];
};

export const VoiceRecordingPlayer = ({
  attachment,
  playbackRates,
}: VoiceRecordingPlayerProps) => {
  const { t } = useTranslationContext();
  const { asset_url, title = t('common.voiceMessage.label', 'Voice message') } =
    attachment;
  const {
    duration = 0,
    file_size,
    mime_type,
    waveform_data,
  } = (attachment as VoiceRecordingAttachment).custom ?? {};

  // Players are namespaced by message (and thread) through `requester`. Outside a message, or when
  // several attachments of one message share an asset URL, widgets for the same URL share a player.
  const { message } = useContext(MessageContext) ?? {};
  const threadInstance = useThreadContext();

  const audioPlayer = useAudioPlayer({
    durationSeconds: duration ?? 0,
    fileSize: file_size,
    mimeType: mime_type,
    playbackRates,
    requester:
      message?.id &&
      `${threadInstance ? (message.parent_id ?? message.id) : ''}${message.id}`,
    // Falls back to the local blob preview while the upload is still in flight.
    src: getAttachmentPreviewUrl(attachment, asset_url),
    title,
    waveformData: waveform_data,
  });

  return audioPlayer ? (
    <VoiceRecordingPlayerUI attachment={attachment} audioPlayer={audioPlayer} />
  ) : null;
};

export type QuotedVoiceRecordingProps = Pick<VoiceRecordingProps, 'attachment'>;

export const QuotedVoiceRecording = ({ attachment }: QuotedVoiceRecordingProps) => {
  const { FileSizeIndicator = DefaultFileSizeIndicator } = useComponentContext();
  const { duration, file_size, mime_type } =
    (attachment as VoiceRecordingAttachment).custom ?? {};
  return (
    <div className={rootClassName} data-testid='quoted-voice-recording-widget'>
      <div className='str-chat__message-attachment__voice-recording-widget__metadata'>
        <div className='str-chat__message-attachment__voice-recording-widget__audio-state'>
          <div className='str-chat__message-attachment__voice-recording-widget__timer'>
            {duration ? (
              <DurationDisplay
                duration={duration}
                isPlaying={false}
                secondsElapsed={undefined}
              />
            ) : (
              <FileSizeIndicator fileSize={file_size} maximumFractionDigits={0} />
            )}
          </div>
        </div>
      </div>
      <FileIcon mimeType={mime_type} />
    </div>
  );
};

export type VoiceRecordingProps = {
  /** Voice recording attachment to render. */
  attachment: Attachment;
  /** Whether the attachment is in a quoted message, where it renders without a player. */
  isQuoted?: boolean;
};

export const VoiceRecording = ({ attachment, isQuoted }: VoiceRecordingProps) =>
  isQuoted ? (
    <QuotedVoiceRecording attachment={attachment} />
  ) : (
    <VoiceRecordingPlayer attachment={attachment} />
  );

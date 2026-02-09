import type { UploadAttachmentPreviewProps } from './types';
import {
  isVoiceRecordingAttachment,
  type LocalAudioAttachment,
  type LocalVoiceRecordingAttachment,
} from 'stream-chat';
import { useTranslationContext } from '../../../context';
import React, { useEffect } from 'react';
import clsx from 'clsx';
import { LoadingIndicatorIcon } from '../icons';
import { RemoveAttachmentPreviewButton } from '../RemoveAttachmentPreviewButton';
import { AttachmentPreviewRoot } from './utils/AttachmentPreviewRoot';
import { FileSizeIndicator, PlaybackRateButton, WaveProgressBar } from '../../Attachment';
import { IconExclamationCircle, IconExclamationTriangle } from '../../Icons';
import { PlayButton } from '../../Button';
import {
  type AudioPlayerState,
  DurationDisplay,
  useAudioPlayer,
} from '../../AudioPlayback';
import { useStateStore } from '../../../store';

export type AudioAttachmentPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<
    | LocalAudioAttachment<CustomLocalMetadata>
    | LocalVoiceRecordingAttachment<CustomLocalMetadata>
  >;

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  canPlayRecord: state.canPlayRecord,
  isPlaying: state.isPlaying,
  playbackRate: state.currentPlaybackRate,
  progressPercent: state.progressPercent,
  secondsElapsed: state.secondsElapsed,
});

export const AudioAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: AudioAttachmentPreviewProps) => {
  const { t } = useTranslationContext();
  const { id, previewUri, uploadPermissionCheck, uploadState } =
    attachment.localMetadata ?? {};
  const url = attachment.asset_url || previewUri;

  const audioPlayer = useAudioPlayer({
    fileSize: attachment.localMetadata.file?.size ?? attachment.file_size,
    mimeType: attachment.localMetadata.file?.type ?? attachment.mime_type,
    requester: attachment.localMetadata.id,
    src: url,
    title: attachment.title,
    waveformData: attachment.waveform_data,
  });

  useEffect(() => {
    audioPlayer?.cancelScheduledRemoval();
    return () => {
      audioPlayer?.scheduleRemoval();
    };
  }, [audioPlayer]);

  const { canPlayRecord, isPlaying, playbackRate, progressPercent, secondsElapsed } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  const resolvedDuration = audioPlayer?.durationSeconds ?? attachment.duration;

  const hasWaveform = !!audioPlayer?.waveformData?.length;
  const hasSizeLimitError = uploadPermissionCheck?.reason === 'size_limit';
  const hasFatalError = uploadState === 'blocked' || hasSizeLimitError;
  const hasRetriableError = uploadState === 'failed' && !!handleRetry;
  const hasError = hasRetriableError || hasFatalError;

  const showProgressControls = !hasError || (hasError && isPlaying);

  return (
    <AttachmentPreviewRoot
      attachment={attachment}
      className={clsx('str-chat__attachment-preview-audio')}
      data-testid='attachment-preview-audio'
    >
      <PlayButton
        isPlaying={Boolean(isPlaying)}
        onClick={() => {
          audioPlayer?.togglePlay();
        }}
      />

      <div className='str-chat__attachment-preview-file__info'>
        <div className='str-chat__attachment-preview-file-name' title={attachment.title}>
          {isVoiceRecordingAttachment(attachment) ? t('Voice message') : attachment.title}
        </div>
        <div className='str-chat__attachment-preview-file__data'>
          {uploadState === 'uploading' && <LoadingIndicatorIcon />}
          {showProgressControls ? (
            <>
              {!resolvedDuration && !progressPercent && !isPlaying && (
                <FileSizeIndicator fileSize={attachment.file_size} />
              )}
              {hasWaveform ? (
                <>
                  <DurationDisplay
                    duration={resolvedDuration}
                    isPlaying={Boolean(isPlaying)}
                    secondsElapsed={secondsElapsed}
                    showRemaining
                  />
                  <WaveProgressBar
                    progress={progressPercent}
                    relativeAmplitudeBarWidth={1}
                    relativeAmplitudeGap={1}
                    seek={audioPlayer.seek}
                    waveformData={audioPlayer.waveformData}
                  />
                </>
              ) : (
                <DurationDisplay
                  duration={resolvedDuration}
                  isPlaying={Boolean(isPlaying)}
                  secondsElapsed={secondsElapsed}
                />
              )}
            </>
          ) : hasFatalError ? (
            <div className='str-chat__attachment-preview-file__fatal-error'>
              <IconExclamationCircle />
              <span>
                {hasSizeLimitError
                  ? t('File too large')
                  : uploadState === 'blocked'
                    ? t('Upload blocked')
                    : t('Upload failed')}
              </span>
            </div>
          ) : (
            <div className='str-chat__attachment-preview-file__retriable-error'>
              <IconExclamationTriangle />
              <span>{t('Upload error')}</span>
              <button
                aria-label={t('aria/Retry upload')}
                className='str-chat__attachment-preview-file__retry-upload-button'
                data-testid='file-preview-item-retry-button'
                onClick={() => {
                  handleRetry(attachment);
                }}
                type='button'
              >
                {t('Retry upload')}
              </button>
            </div>
          )}
        </div>
      </div>
      {audioPlayer && canPlayRecord && (
        <PlaybackRateButton onClick={audioPlayer.increasePlaybackRate}>
          x{playbackRate?.toString()}
        </PlaybackRateButton>
      )}
      <RemoveAttachmentPreviewButton
        data-testid='audio-preview-item-delete-button'
        onClick={() => {
          if (id) removeAttachments([id]);
        }}
        uploadState={uploadState}
      />
    </AttachmentPreviewRoot>
  );
};

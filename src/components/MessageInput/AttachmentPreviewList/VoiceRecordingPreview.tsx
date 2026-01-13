import React, { useEffect } from 'react';
import { PlayButton } from '../../Attachment';
import { RecordingTimer } from '../../MediaRecorder';
import { CloseIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';
import { FileIcon } from '../../ReactFileUtilities';
import type { LocalVoiceRecordingAttachment } from 'stream-chat';
import type { UploadAttachmentPreviewProps } from './types';
import { useTranslationContext } from '../../../context';
import { type AudioPlayerState, useAudioPlayer } from '../../AudioPlayback';
import { useStateStore } from '../../../store';

const audioPlayerStateSelector = (state: AudioPlayerState) => ({
  isPlaying: state.isPlaying,
  secondsElapsed: state.secondsElapsed,
});

export type VoiceRecordingPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalVoiceRecordingAttachment<CustomLocalMetadata>>;

export const VoiceRecordingPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: VoiceRecordingPreviewProps) => {
  const { t } = useTranslationContext();

  const audioPlayer = useAudioPlayer({
    mimeType: attachment.mime_type,
    src: attachment.asset_url,
  });

  const { isPlaying, secondsElapsed } =
    useStateStore(audioPlayer?.state, audioPlayerStateSelector) ?? {};

  useEffect(() => {
    audioPlayer?.cancelScheduledRemoval();
    return () => {
      audioPlayer?.scheduleRemoval();
    };
  }, [audioPlayer]);

  if (!audioPlayer) return null;

  return (
    <div
      className='str-chat__attachment-preview-voice-recording'
      data-testid='attachment-preview-voice-recording'
    >
      <PlayButton isPlaying={!!isPlaying} onClick={audioPlayer.togglePlay} />

      <button
        aria-label={t('aria/Remove attachment')}
        className='str-chat__attachment-preview-delete'
        data-testid='file-preview-item-delete-button'
        disabled={attachment.localMetadata?.uploadState === 'uploading'}
        onClick={() =>
          attachment.localMetadata?.id && removeAttachments([attachment.localMetadata.id])
        }
        type='button'
      >
        <CloseIcon />
      </button>

      {['blocked', 'failed'].includes(attachment.localMetadata?.uploadState) &&
        !!handleRetry && (
          <button
            aria-label={t('aria/Retry upload')}
            className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file'
            data-testid='file-preview-item-retry-button'
            onClick={() => handleRetry(attachment)}
          >
            <RetryIcon />
          </button>
        )}

      <div className='str-chat__attachment-preview-metadata'>
        <div className='str-chat__attachment-preview-file-name' title={attachment.title}>
          {attachment.title}
        </div>
        {typeof attachment.duration !== 'undefined' && (
          <RecordingTimer durationSeconds={secondsElapsed || attachment.duration} />
        )}
        {attachment.localMetadata?.uploadState === 'uploading' && (
          <LoadingIndicatorIcon size={17} />
        )}
      </div>
      <div className='str-chat__attachment-preview-file-icon'>
        <FileIcon filename={attachment.title} mimeType={attachment.mime_type} />
      </div>
    </div>
  );
};

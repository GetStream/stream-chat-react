import React from 'react';
import { PlayButton } from '../../Attachment';
import { RecordingTimer } from '../../MediaRecorder';
import { CloseIcon, LoadingIndicatorIcon, RetryIcon } from '../icons';
import { FileIcon } from '../../ReactFileUtilities';
import { useAudioController } from '../../Attachment/hooks/useAudioController';
import type { LocalVoiceRecordingAttachment } from 'stream-chat';
import type { UploadAttachmentPreviewProps } from './types';

export type VoiceRecordingPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalVoiceRecordingAttachment<CustomLocalMetadata>>;

export const VoiceRecordingPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: VoiceRecordingPreviewProps) => {
  const { audioRef, isPlaying, secondsElapsed, togglePlay } = useAudioController({
    mimeType: attachment.mime_type,
  });

  return (
    <div
      className='str-chat__attachment-preview-voice-recording'
      data-testid='attachment-preview-voice-recording'
    >
      <audio ref={audioRef}>
        <source
          data-testid='audio-source'
          src={attachment.asset_url}
          type={attachment.mime_type}
        />
      </audio>
      <PlayButton isPlaying={isPlaying} onClick={togglePlay} />

      <button
        className='str-chat__attachment-preview-delete'
        data-testid='file-preview-item-delete-button'
        disabled={attachment.localMetadata?.uploadState === 'uploading'}
        onClick={() =>
          attachment.localMetadata?.id && removeAttachments([attachment.localMetadata.id])
        }
      >
        <CloseIcon />
      </button>

      {['blocked', 'failed'].includes(attachment.localMetadata?.uploadState) &&
        !!handleRetry && (
          <button
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

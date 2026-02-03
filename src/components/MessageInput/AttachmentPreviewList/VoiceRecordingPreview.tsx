import type { LocalVoiceRecordingAttachment } from 'stream-chat';
import type { UploadAttachmentPreviewProps } from './types';

export type VoiceRecordingPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalVoiceRecordingAttachment<CustomLocalMetadata>>;

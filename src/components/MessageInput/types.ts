/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { Attachment, OGAttachment } from 'stream-chat';

export type AttachmentLoadingState = 'uploading' | 'finished' | 'failed';

export enum LinkPreviewState {
  /** Link preview has been dismissed using MessageInputContextValue.dismissLinkPreview **/
  DISMISSED = 'dismissed',
  /** Link preview could not be loaded, the enrichment request has failed. **/
  FAILED = 'failed',
  /** Link preview has been successfully loaded. **/
  LOADED = 'loaded',
  /** The enrichment query is in progress for a given link. **/
  LOADING = 'loading',
  /** The link is scheduled for enrichment. **/
  QUEUED = 'queued',
}

export type LinkURL = string;

export type LinkPreview = OGAttachment & {
  state: LinkPreviewState;
};

export enum SetLinkPreviewMode {
  UPSERT,
  SET,
  REMOVE,
}

export type LinkPreviewMap = Map<LinkURL, LinkPreview>;

export type VoiceRecordingAttachment = Attachment & {
  asset_url: string;
  type: 'voiceRecording';
  duration?: number;
  file_size?: number;
  mime_type?: string;
  title?: string;
  waveform_data?: Array<number>;
};

type FileAttachment = Attachment & {
  type: 'file';
  asset_url?: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
};

export type AudioAttachment = Attachment & {
  type: 'audio';
  asset_url?: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
};

export type VideoAttachment = Attachment & {
  type: 'video';
  asset_url?: string;
  mime_type?: string;
  thumb_url?: string;
  title?: string;
};

type ImageAttachment = Attachment & {
  type: 'image';
  fallback?: string;
  image_url?: string;
  original_height?: number;
  original_width?: number;
};

export type BaseLocalAttachmentMetadata = {
  id: string;
};

export type LocalAttachmentUploadMetadata = {
  file?: File;
  uploadState?: AttachmentLoadingState;
};

export type LocalImageAttachmentUploadMetadata = LocalAttachmentUploadMetadata & {
  previewUri?: string;
};

export type LocalAttachmentCast<A, L = {}> = A & {
  localMetadata: L & BaseLocalAttachmentMetadata;
};

export type LocalAttachmentMetadata<CustomLocalMetadata = {}> = CustomLocalMetadata &
  BaseLocalAttachmentMetadata &
  LocalImageAttachmentUploadMetadata;

export type LocalVoiceRecordingAttachment<CustomLocalMetadata = {}> = LocalAttachmentCast<
  VoiceRecordingAttachment,
  LocalAttachmentUploadMetadata & CustomLocalMetadata
>;

export type LocalAudioAttachment<CustomLocalMetadata = {}> = LocalAttachmentCast<
  AudioAttachment,
  LocalAttachmentUploadMetadata & CustomLocalMetadata
>;

export type LocalVideoAttachment<CustomLocalMetadata = {}> = LocalAttachmentCast<
  VideoAttachment,
  LocalAttachmentUploadMetadata & CustomLocalMetadata
>;

export type LocalImageAttachment<CustomLocalMetadata = {}> = LocalAttachmentCast<
  ImageAttachment,
  LocalImageAttachmentUploadMetadata & CustomLocalMetadata
>;

export type LocalFileAttachment<CustomLocalMetadata = {}> = LocalAttachmentCast<
  FileAttachment,
  LocalAttachmentUploadMetadata & CustomLocalMetadata
>;

export type AnyLocalAttachment<CustomLocalMetadata = {}> = LocalAttachmentCast<
  Attachment,
  LocalAttachmentMetadata<CustomLocalMetadata>
>;

export type LocalAttachment =
  | AnyLocalAttachment
  | LocalFileAttachment
  | LocalImageAttachment
  | LocalAudioAttachment
  | LocalVideoAttachment
  | LocalVoiceRecordingAttachment;

export type LocalAttachmentToUpload<CustomLocalMetadata = {}> = Partial<Attachment> & {
  localMetadata: Partial<BaseLocalAttachmentMetadata> &
    LocalAttachmentUploadMetadata &
    CustomLocalMetadata;
};

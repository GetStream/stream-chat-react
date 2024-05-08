import type { Attachment, DefaultGenerics, ExtendableGenerics, OGAttachment } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type AttachmentLoadingState = 'uploading' | 'finished' | 'failed';

export type FileUpload = {
  file: {
    name: string;
    lastModified?: number;
    lastModifiedDate?: Date;
    size?: number;
    type?: string;
    uri?: string;
  };
  id: string;
  state: AttachmentLoadingState;
  thumb_url?: string;
  url?: string;
};
export type ImageUpload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  file: {
    name: string;
    height?: number;
    lastModified?: number;
    lastModifiedDate?: Date;
    size?: number;
    type?: string;
    uri?: string;
    width?: number;
  };
  id: string;
  state: AttachmentLoadingState;
  previewUri?: string;
  url?: string;
} & Pick<
  Attachment<StreamChatGenerics>,
  'og_scrape_url' | 'title' | 'title_link' | 'author_name' | 'text'
>;

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

export type VoiceRecordingAttachment<
  StreamChatGenerics extends ExtendableGenerics = DefaultGenerics
> = Attachment<StreamChatGenerics> & {
  asset_url: string;
  type: 'voiceRecording';
  duration?: number;
  file_size?: number;
  mime_type?: string;
  title?: string;
  waveform_data?: Array<number>;
};

type FileAttachment<
  StreamChatGenerics extends ExtendableGenerics = DefaultGenerics
> = Attachment<StreamChatGenerics> & {
  type: 'file';
  asset_url?: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
};

export type AudioAttachment<
  StreamChatGenerics extends ExtendableGenerics = DefaultGenerics
> = Attachment<StreamChatGenerics> & {
  type: 'audio';
  asset_url?: string;
  file_size?: number;
  mime_type?: string;
  title?: string;
};

export type VideoAttachment<
  StreamChatGenerics extends ExtendableGenerics = DefaultGenerics
> = Attachment<StreamChatGenerics> & {
  type: 'video';
  asset_url?: string;
  mime_type?: string;
  thumb_url?: string;
  title?: string;
};

type ImageAttachment<
  StreamChatGenerics extends ExtendableGenerics = DefaultGenerics
> = Attachment<StreamChatGenerics> & {
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

export type LocalAttachmentCast<A, L = unknown> = A & {
  localMetadata: L & BaseLocalAttachmentMetadata;
};

export type LocalAttachmentMetadata<T = unknown> = T &
  BaseLocalAttachmentMetadata &
  LocalImageAttachmentUploadMetadata;

export type LocalVoiceRecordingAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  T = unknown
> = LocalAttachmentCast<
  VoiceRecordingAttachment<StreamChatGenerics>,
  LocalAttachmentUploadMetadata & T
>;

export type LocalAudioAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  T = unknown
> = LocalAttachmentCast<AudioAttachment<StreamChatGenerics>, LocalAttachmentUploadMetadata & T>;

export type LocalVideoAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  T = unknown
> = LocalAttachmentCast<VideoAttachment<StreamChatGenerics>, LocalAttachmentUploadMetadata & T>;

export type LocalImageAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  T = unknown
> = LocalAttachmentCast<
  ImageAttachment<StreamChatGenerics>,
  LocalImageAttachmentUploadMetadata & T
>;

export type LocalFileAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  T = unknown
> = LocalAttachmentCast<FileAttachment<StreamChatGenerics>, LocalAttachmentUploadMetadata & T>;

export type AnyLocalAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  T = unknown
> = LocalAttachmentCast<Attachment<StreamChatGenerics>, LocalAttachmentMetadata<T>>;

export type LocalAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> =
  | AnyLocalAttachment<StreamChatGenerics>
  | LocalFileAttachment<StreamChatGenerics>
  | LocalImageAttachment<StreamChatGenerics>
  | LocalAudioAttachment<StreamChatGenerics>
  | LocalVideoAttachment<StreamChatGenerics>
  | LocalVoiceRecordingAttachment<StreamChatGenerics>;

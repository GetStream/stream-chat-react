import type { Attachment, OGAttachment } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types/types';

type FileAttachmentType = 'audio' | 'file' | 'video';
type ImageAttachmentType = 'image';

type FileType = FileAttachmentType | ImageAttachmentType;

export enum UploadState {
  failed = 'failed',
  finished = 'finished',
  uploading = 'uploading',
}

type BaseFileData = {
  name: string;
  lastModified?: number;
  lastModifiedDate?: Date;
  size?: number;
  // type: string necessary to be compatible with Blob type;
  type?: string;
  uri?: string;
};

type FileData = BaseFileData & {
  type?: 'file';
};

type ImageFileData = BaseFileData & {
  height?: number;
  type?: 'image';
  width?: number;
};

export type FileUpload = {
  file: FileData;
  id: string;
  state: UploadState;
  type: 'file';
  thumb_url?: string;
  url?: string;
};

export type ImageUpload = {
  file: ImageFileData;
  id: string;
  state: UploadState;
  type: ImageAttachmentType;
  previewUri?: string;
  title?: string;
  url?: string;
};

export type MessageComposerUploadAttachment = {
  file: FileUpload['file'] | ImageUpload['file'];
  id: string;
  type: FileType;
  uploadState: UploadState;
};

export type MessageComposerFileAttachment = {
  // url of the file in the Stream's CDN
  asset_url: string;
  file_size: number;
  id: string;
  mime_type: string;
  type: FileAttachmentType;
  // reference to the data provided from the input of type file
  file?: FileData;
  thumb_url?: string;
  // the file name
  title?: string;
  uploadState?: UploadState;
};

export type MessageComposerImageAttachment = {
  id: string;
  // url of the file in the Stream's CDN
  image_url: string;
  type: ImageAttachmentType;
  // the original file name
  fallback?: string;
  // reference to the data provided from the input of type file
  file?: ImageFileData;
  // image preview URL created from the file object
  previewUri?: string;
  // the file name
  title?: string;
  uploadState?: UploadState;
};

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
  id: string;
  state: LinkPreviewState;
};

export enum SetLinkPreviewMode {
  UPSERT,
  SET,
  REMOVE,
}

export type LinkPreviewMap = Map<LinkURL, LinkPreview>;

export type MessageComposerAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = { id: string } & (
  | Attachment<StreamChatGenerics>
  | MessageComposerFileAttachment
  | MessageComposerImageAttachment
  | LinkPreview
);

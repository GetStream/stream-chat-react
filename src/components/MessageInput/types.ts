import type { Attachment, OGAttachment } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types/types';

type AttachmentLoadingState = 'uploading' | 'finished' | 'failed';

export enum LinkPreviewState {
  DISMISSED = 'dismissed',
  FAILED = 'failed',
  LOADED = 'loaded',
  LOADING = 'loading',
  QUEUED = 'queued',
}

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

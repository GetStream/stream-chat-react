import { Attachment, OGAttachment } from 'stream-chat';
import { FileUpload, ImageUpload, MessageComposerAttachment, UploadState } from './types';
import { nanoid } from 'nanoid';
import { DefaultStreamChatGenerics } from '../../types/types';
import {
  isMessageComposerFileAttachment,
  isMessageComposerImageAttachment,
} from './hooks/useAttachments';

export const attachmentToFileUpload = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  asset_url,
  file_size,
  id,
  thumb_url,
  title = '',
}: Attachment<StreamChatGenerics>): FileUpload => ({
  file: {
    name: title,
    size: file_size,
    type: 'file',
  },
  id: id || nanoid(),
  state: UploadState.finished,
  thumb_url,
  type: 'file',
  url: asset_url,
});

export const attachmentToImageUpload = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  author_name,
  fallback = '',
  id,
  image_url,
  og_scrape_url,
  text,
  title,
  title_link,
}: Attachment<StreamChatGenerics>): ImageUpload & Partial<OGAttachment> => ({
  author_name,
  file: {
    name: fallback,
    type: 'image',
  },
  id: id || nanoid(),
  image_url,
  og_scrape_url,
  state: UploadState.finished,
  text,
  title,
  title_link,
  type: 'image',
});

export const messageComposerAttachmentToFileUpload = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: MessageComposerAttachment<StreamChatGenerics>,
): Partial<FileUpload> => {
  const result: Partial<FileUpload> = {};
  if (!isMessageComposerFileAttachment(attachment)) return result;
  if (attachment.file) result.file = attachment.file;
  if (attachment.id) result.id = attachment.id;
  if (attachment.uploadState) result.state = attachment.uploadState;
  if (attachment.type) result.type = 'file';
  if (attachment.thumb_url) result.thumb_url = attachment.thumb_url;
  if (attachment.asset_url) result.url = attachment.asset_url;

  return result;
};

export const messageComposerAttachmentToImageUpload = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: MessageComposerAttachment<StreamChatGenerics>,
): Partial<ImageUpload> => {
  const result: Partial<ImageUpload> = {};
  if (!isMessageComposerImageAttachment(attachment)) return result;
  if (attachment.file) result.file = attachment.file;
  if (attachment.id) result.id = attachment.id;
  if (attachment.uploadState) result.state = attachment.uploadState;
  if (attachment.type) result.type = attachment.type;
  if (attachment.previewUri) result.previewUri = attachment.previewUri;
  if (attachment.image_url) result.url = attachment.image_url;

  return result;
};

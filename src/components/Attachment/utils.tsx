import { ReactNode } from 'react';

import type { Attachment } from 'stream-chat';
import type { ATTACHMENT_GROUPS_ORDER, AttachmentProps } from './Attachment';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import type {
  LocalAttachment,
  LocalAudioAttachment,
  LocalFileAttachment,
  LocalImageAttachment,
  LocalVideoAttachment,
  LocalVoiceRecordingAttachment,
  VoiceRecordingAttachment,
} from '../MessageInput';

export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/ogg', 'video/webm', 'video/quicktime'];

export type AttachmentComponentType = typeof ATTACHMENT_GROUPS_ORDER[number];

export type GroupedRenderedAttachment = Record<AttachmentComponentType, ReactNode[]>;

export type GalleryAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  images: Attachment<StreamChatGenerics>[];
  type: 'gallery';
};

export type RenderAttachmentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Omit<AttachmentProps<StreamChatGenerics>, 'attachments'> & {
  attachment: Attachment<StreamChatGenerics>;
};

export type RenderGalleryProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Omit<AttachmentProps<StreamChatGenerics>, 'attachments'> & {
  attachment: GalleryAttachment<StreamChatGenerics>;
};

export const isLocalAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: UnknownType,
): attachment is LocalAttachment<StreamChatGenerics> =>
  !!(attachment.localMetadata as LocalAttachment)?.id;

export const isScrapedContent = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics>,
) => attachment.og_scrape_url || attachment.title_link;

export const isUploadedImage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics>,
) => attachment.type === 'image' && !isScrapedContent(attachment);

export const isLocalImageAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
): attachment is LocalImageAttachment<StreamChatGenerics> =>
  isUploadedImage(attachment) && isLocalAttachment(attachment);

export const isGalleryAttachmentType = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  output: Attachment<StreamChatGenerics> | GalleryAttachment<StreamChatGenerics>,
): output is GalleryAttachment<StreamChatGenerics> => Array.isArray(output.images);

export const isAudioAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
) => attachment.type === 'audio';

export const isLocalAudioAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
): attachment is LocalAudioAttachment<StreamChatGenerics> =>
  isAudioAttachment(attachment) && isLocalAttachment(attachment);

export const isVoiceRecordingAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
): attachment is VoiceRecordingAttachment => attachment.type === 'voiceRecording';

export const isLocalVoiceRecordingAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
): attachment is LocalVoiceRecordingAttachment<StreamChatGenerics> =>
  isVoiceRecordingAttachment(attachment) && isLocalAttachment(attachment);

export const isFileAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
) =>
  attachment.type === 'file' ||
  !!(
    attachment.mime_type &&
    SUPPORTED_VIDEO_FORMATS.indexOf(attachment.mime_type) === -1 &&
    attachment.type !== 'video'
  );

export const isLocalFileAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
): attachment is LocalFileAttachment<StreamChatGenerics> =>
  isFileAttachment(attachment) && isLocalAttachment(attachment);

export const isMediaAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
) =>
  (attachment.mime_type && SUPPORTED_VIDEO_FORMATS.indexOf(attachment.mime_type) !== -1) ||
  attachment.type === 'video';

export const isLocalMediaAttachment = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>,
): attachment is LocalVideoAttachment<StreamChatGenerics> =>
  isMediaAttachment(attachment) && isLocalAttachment(attachment);

export const isSvgAttachment = (attachment: Attachment) => {
  const filename = attachment.fallback || '';
  return filename.toLowerCase().endsWith('.svg');
};

export const divMod = (num: number, divisor: number) => [Math.floor(num / divisor), num % divisor];

export const displayDuration = (totalSeconds?: number) => {
  if (!totalSeconds || totalSeconds < 0) return '00:00';

  const [hours, hoursLeftover] = divMod(totalSeconds, 3600);
  const [minutes, seconds] = divMod(hoursLeftover, 60);
  const roundedSeconds = Math.ceil(seconds);

  const prependHrsZero = hours.toString().length === 1 ? '0' : '';
  const prependMinZero = minutes.toString().length === 1 ? '0' : '';
  const prependSecZero = roundedSeconds.toString().length === 1 ? '0' : '';
  const minSec = `${prependMinZero}${minutes}:${prependSecZero}${roundedSeconds}`;

  return hours ? `${prependHrsZero}${hours}:` + minSec : minSec;
};

import type { ReactNode } from 'react';
import type {
  Attachment,
  LocalAttachment,
  LocalAudioAttachment,
  LocalImageAttachment,
  LocalVoiceRecordingAttachment,
  VoiceRecordingAttachment,
} from 'stream-chat';

import type { ATTACHMENT_GROUPS_ORDER, AttachmentProps } from './Attachment';
import type { LocalFileAttachment, LocalVideoAttachment } from '../MessageInput';

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/ogg',
  'video/webm',
  'video/quicktime',
];

export type AttachmentComponentType = (typeof ATTACHMENT_GROUPS_ORDER)[number];

export type GroupedRenderedAttachment = Record<AttachmentComponentType, ReactNode[]>;

export type GalleryAttachment = {
  images: Attachment[];
  type: 'gallery';
};

export type RenderAttachmentProps = Omit<AttachmentProps, 'attachments'> & {
  attachment: Attachment;
};

export type RenderGalleryProps = Omit<AttachmentProps, 'attachments'> & {
  attachment: GalleryAttachment;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isLocalAttachment = (attachment: any): attachment is LocalAttachment =>
  !!(attachment as LocalAttachment).localMetadata?.id;

export const isScrapedContent = (attachment: Attachment) =>
  attachment.og_scrape_url || attachment.title_link;

export const isUploadedImage = (attachment: Attachment) =>
  attachment.type === 'image' && !isScrapedContent(attachment);

export const isLocalImageAttachment = (
  attachment: Attachment | LocalAttachment,
): attachment is LocalImageAttachment =>
  isUploadedImage(attachment) && isLocalAttachment(attachment);

export const isGalleryAttachmentType = (
  attachment: Attachment | GalleryAttachment,
): attachment is GalleryAttachment =>
  Array.isArray((attachment as GalleryAttachment).images);

export const isAudioAttachment = (attachment: Attachment | LocalAttachment) =>
  attachment.type === 'audio';

export const isLocalAudioAttachment = (
  attachment: Attachment | LocalAttachment,
): attachment is LocalAudioAttachment =>
  isAudioAttachment(attachment) && isLocalAttachment(attachment);

export const isVoiceRecordingAttachment = (
  attachment: Attachment | LocalAttachment,
): attachment is VoiceRecordingAttachment => attachment.type === 'voiceRecording';

export const isLocalVoiceRecordingAttachment = (
  attachment: Attachment | LocalAttachment,
): attachment is LocalVoiceRecordingAttachment =>
  isVoiceRecordingAttachment(attachment) && isLocalAttachment(attachment);

export const isFileAttachment = (attachment: Attachment | LocalAttachment) =>
  attachment.type === 'file' ||
  !!(
    attachment.mime_type &&
    SUPPORTED_VIDEO_FORMATS.indexOf(attachment.mime_type) === -1 &&
    attachment.type !== 'video'
  );

export const isLocalFileAttachment = (
  attachment: Attachment | LocalAttachment,
): attachment is LocalFileAttachment =>
  isFileAttachment(attachment) && isLocalAttachment(attachment);

export const isMediaAttachment = (attachment: Attachment | LocalAttachment) =>
  (attachment.mime_type &&
    SUPPORTED_VIDEO_FORMATS.indexOf(attachment.mime_type) !== -1) ||
  attachment.type === 'video';

export const isLocalMediaAttachment = (
  attachment: Attachment | LocalAttachment,
): attachment is LocalVideoAttachment =>
  isMediaAttachment(attachment) && isLocalAttachment(attachment);

export const isSvgAttachment = (attachment: Attachment) => {
  const filename = attachment.fallback || '';
  return filename.toLowerCase().endsWith('.svg');
};

export const divMod = (num: number, divisor: number) => [
  Math.floor(num / divisor),
  num % divisor,
];

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

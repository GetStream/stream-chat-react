import {
  type Attachment,
  convertTimestampToDate,
  formatMessage,
  isImageAttachment,
  isVideoAttachment,
  type LocalMessage,
  type MessageResponse,
  type UserResponse,
  type VoiceRecordingAttachment,
} from 'stream-chat';

import { toBaseImageDescriptors } from '../../../../components/BaseImage';
import type { GalleryItem } from '../../../../components/Gallery';

/** Attachment types rendered by the media gallery. */
export const MEDIA_ATTACHMENT_TYPES = ['image', 'video'] as const;

export type ChannelMediaItemType = (typeof MEDIA_ATTACHMENT_TYPES)[number];

export type ChannelMediaItem = {
  /** Item to hand over to the full-screen `Gallery` viewer. */
  galleryItem: GalleryItem;
  /** Stable identity: message ID and attachment index. */
  id: string;
  type: ChannelMediaItemType;
  /** Video duration in seconds, when known. */
  durationSeconds?: number;
  /** User who shared the media. */
  user?: UserResponse;
};

const getMediaAttachmentType = (
  attachment: Attachment,
): ChannelMediaItemType | undefined => {
  if (isVideoAttachment(attachment)) return 'video';
  if (isImageAttachment(attachment)) return 'image';
  return undefined;
};

/** Flattens messages into one media item per renderable image or video attachment. */
export const toChannelMediaItems = (
  messages: Array<MessageResponse | LocalMessage>,
): ChannelMediaItem[] => {
  const items: ChannelMediaItem[] = [];

  messages.forEach((message) => {
    // Formatted once per message: the gallery header passes it to a `MessageTimestamp` override,
    // which takes a `LocalMessage`.
    let localMessage: LocalMessage | undefined;
    message.attachments?.forEach((attachment, index) => {
      const type = getMediaAttachmentType(attachment);
      if (!type) return;

      const descriptor = toBaseImageDescriptors(attachment);
      if (!descriptor) return;

      const hasRenderableSource =
        type === 'video'
          ? Boolean(descriptor.videoThumbnailUrl || descriptor.videoUrl)
          : Boolean(descriptor.imageUrl);
      if (!hasRenderableSource) return;

      const attachmentDuration = (attachment as VoiceRecordingAttachment).custom
        ?.duration;

      items.push({
        durationSeconds:
          typeof attachmentDuration === 'number' ? attachmentDuration : undefined,
        galleryItem: {
          ...descriptor,
          // the gallery header reads sender and timestamp off the item
          createdAt: convertTimestampToDate(message.created_at),
          message: (localMessage ??= formatMessage(message)),
          user: message.user ?? undefined,
        },
        id: `${message.id}-${index}`,
        type,
        user: message.user ?? undefined,
      });
    });
  });

  return items;
};

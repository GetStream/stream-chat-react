import {
  type Attachment,
  isImageAttachment,
  isVideoAttachment,
  type LocalMessage,
  type MessageResponse,
  type UserResponse,
} from 'stream-chat';

import { toBaseImageDescriptors } from '../../../BaseImage';
import type { GalleryItem } from '../../../Gallery';

/** Attachment types rendered by the media gallery. */
export const MEDIA_ATTACHMENT_TYPES = ['image', 'video'] as const;

export type ChannelMediaItemType = (typeof MEDIA_ATTACHMENT_TYPES)[number];

export type ChannelMediaItem = {
  /** Item to hand over to the full-screen `Gallery` viewer. */
  galleryItem: GalleryItem;
  /** Stable identity (messageId + attachment index). */
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

/**
 * Flattens messages into one renderable media item per image/video attachment,
 * carrying over the gallery descriptor, posting user, and video duration.
 */
export const toChannelMediaItems = (
  messages: Array<MessageResponse | LocalMessage>,
): ChannelMediaItem[] => {
  const items: ChannelMediaItem[] = [];

  messages.forEach((message) => {
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

      items.push({
        durationSeconds:
          typeof attachment.duration === 'number' ? attachment.duration : undefined,
        galleryItem: { ...descriptor },
        id: `${message.id}-${index}`,
        type,
        user: message.user ?? undefined,
      });
    });
  });

  return items;
};

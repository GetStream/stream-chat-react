import {
  type Attachment,
  isScrapedContent,
  type LocalMessage,
  type MessageResponse,
} from 'stream-chat';

import { isDate } from '../../../../i18n/utils';

/** Attachment types listed by the files view (everything that is not an image/video). */
export const FILE_ATTACHMENT_TYPES = ['file', 'audio'] as const;

export type ChannelFileAttachmentType = (typeof FILE_ATTACHMENT_TYPES)[number];

const FILE_ATTACHMENT_TYPE_SET = new Set<string>(FILE_ATTACHMENT_TYPES);

export type ChannelFileItem = {
  /** Raw attachment to render (no transformation applied). */
  attachment: Attachment;
  /** Stable identity (messageId + attachment index). */
  id: string;
  /** ISO timestamp of the carrying message, used for the month sections. */
  createdAt?: string;
};

export type ChannelFileGroup = {
  /** Items belonging to the same month/year. */
  items: ChannelFileItem[];
  /** Stable grouping key (`YYYY-MM` or `unknown`). */
  key: string;
  /** Representative timestamp used to render the section header. */
  timestamp?: string;
};

const normalizeTimestamp = (timestamp?: string | Date) => {
  if (!timestamp) return undefined;
  return isDate(timestamp) ? timestamp.toISOString() : timestamp;
};

const isChannelFileAttachment = (attachment: Attachment) =>
  !isScrapedContent(attachment) &&
  !!attachment.type &&
  FILE_ATTACHMENT_TYPE_SET.has(attachment.type);

const byCreatedAtDesc = (a: ChannelFileItem, b: ChannelFileItem) =>
  (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

/**
 * Flattens messages into file/audio attachment items grouped into descending
 * month/year sections (newest first), in a single pass over the attachments.
 *
 * The raw attachment is kept untransformed; only the carrying message timestamp
 * is captured for the month sections.
 */
export const toChannelFileGroups = (
  messages: Array<MessageResponse | LocalMessage>,
): ChannelFileGroup[] => {
  const groups: ChannelFileGroup[] = [];
  const groupIndexByKey = new Map<string, number>();

  messages.forEach((message) => {
    const createdAt = normalizeTimestamp(message.created_at);
    const key = createdAt ? createdAt.slice(0, 7) : 'unknown';

    message.attachments?.forEach((attachment, index) => {
      if (!isChannelFileAttachment(attachment)) return;

      const item: ChannelFileItem = {
        attachment,
        createdAt,
        id: `${message.id}-${index}`,
      };
      const existingIndex = groupIndexByKey.get(key);

      if (existingIndex === undefined) {
        groupIndexByKey.set(key, groups.length);
        groups.push({ items: [item], key, timestamp: createdAt });
      } else {
        groups[existingIndex].items.push(item);
      }
    });
  });

  groups.forEach((group) => {
    group.items.sort(byCreatedAtDesc);
    group.timestamp = group.items[0]?.createdAt;
  });
  groups.sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));

  return groups;
};

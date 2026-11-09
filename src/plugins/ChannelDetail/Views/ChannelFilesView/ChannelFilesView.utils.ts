import {
  type Attachment,
  isScrapedContent,
  type LocalMessage,
  type MessageResponse,
  type TimestampNS,
} from 'stream-chat';

import { convertTimestampToDate } from 'stream-chat';

/** Attachment types listed by the files view. */
export const FILE_ATTACHMENT_TYPES = ['file', 'audio'] as const;

export type ChannelFileAttachmentType = (typeof FILE_ATTACHMENT_TYPES)[number];

const FILE_ATTACHMENT_TYPE_SET = new Set<string>(FILE_ATTACHMENT_TYPES);

export type ChannelFileItem = {
  /** Attachment as received, untransformed. */
  attachment: Attachment;
  /** Stable identity: message ID and attachment index. */
  id: string;
  /** ISO timestamp of the carrying message, used to pick the month section. */
  createdAt?: string;
};

export type ChannelFileSection = {
  /** Stable grouping key (`YYYY-MM` or `unknown`). */
  key: string;
  /** Timestamp of the section's newest item, rendered in the section header. */
  timestamp?: string;
};

export type ChannelFileSections = {
  /** Item count per section, aligned with `sections`; the sum equals `items.length`. */
  groupCounts: number[];
  /** Flat list of items in display order, grouped contiguously by section. */
  items: ChannelFileItem[];
  /** Month sections, aligned with `groupCounts`. */
  sections: ChannelFileSection[];
};

/**
 * A wire timestamp as an ISO string, which `getDateString` accepts, the month key slices and
 * `byCreatedAtDesc` compares. A nanosecond value is out of `Date`'s range, so it goes through
 * `convertTimestampToDate` instead of `new Date`.
 */
const normalizeTimestamp = (timestamp?: TimestampNS) =>
  timestamp == null ? undefined : convertTimestampToDate(timestamp)?.toISOString();

const isChannelFileAttachment = (attachment: Attachment) =>
  !isScrapedContent(attachment) &&
  !!attachment.type &&
  FILE_ATTACHMENT_TYPE_SET.has(attachment.type);

const byCreatedAtDesc = (a: ChannelFileItem, b: ChannelFileItem) =>
  (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

/**
 * Flattens messages into file and audio attachment items in month sections, newest first.
 *
 * The result is shaped for GroupedVirtuoso: a flat `items` array grouped contiguously by section,
 * with `groupCounts` and `sections` aligned to it.
 */
export const toChannelFileSections = (
  messages: Array<MessageResponse | LocalMessage>,
): ChannelFileSections => {
  const groups: Array<ChannelFileSection & { items: ChannelFileItem[] }> = [];
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

  return {
    groupCounts: groups.map((group) => group.items.length),
    items: groups.flatMap((group) => group.items),
    sections: groups.map(({ key, timestamp }) => ({ key, timestamp })),
  };
};

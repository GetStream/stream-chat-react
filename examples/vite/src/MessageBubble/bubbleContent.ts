import {
  defaultMessageBubbleContentSet,
  type DefaultMessageBubbleContentType,
  type MessageBubbleContentSetItem,
} from 'stream-chat-react';

export const BUBBLE_CONTENT_LABELS: Record<DefaultMessageBubbleContentType, string> = {
  attachments: 'Attachments',
  poll: 'Poll',
  quotedMessage: 'Quoted message',
  text: 'Text',
};

const DEFAULT_TYPES = defaultMessageBubbleContentSet.map(({ type }) => type);

/**
 * The stored order, minus types the SDK no longer ships, plus default types it does not list yet
 * (appended), so the setting survives SDK upgrades.
 */
export const resolveBubbleContentOrder = (order: string[]) => [
  ...order.filter((type) => DEFAULT_TYPES.includes(type)),
  ...DEFAULT_TYPES.filter((type) => !order.includes(type)),
];

/** `defaultMessageBubbleContentSet` in the order set in Settings -> Message. */
export const buildBubbleContentSet = (order: string[]): MessageBubbleContentSetItem[] =>
  resolveBubbleContentOrder(order).flatMap((type) =>
    defaultMessageBubbleContentSet.filter((item) => item.type === type),
  );

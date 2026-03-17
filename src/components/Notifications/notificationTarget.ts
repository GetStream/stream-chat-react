import type { Notification } from 'stream-chat';

const NOTIFICATION_TARGET_PANELS = [
  'channel',
  'thread',
  'channel-list',
  'thread-list',
] as const;

/**
 * Panel where a notification should be consumed.
 * Use in origin.context.panel when publishing so NotificationList can filter by panel.
 */
export type NotificationTargetPanel = (typeof NOTIFICATION_TARGET_PANELS)[number];

export const isNotificationTargetPanel = (
  value: unknown,
): value is NotificationTargetPanel =>
  typeof value === 'string' &&
  (NOTIFICATION_TARGET_PANELS as readonly string[]).includes(value);

export const getNotificationTargetPanel = (
  notification: Notification,
): NotificationTargetPanel | undefined => {
  const targetTag = notification.tags?.find((tag) => tag.startsWith('target:'));
  if (targetTag) {
    const candidate = targetTag.slice('target:'.length);
    if (isNotificationTargetPanel(candidate)) return candidate;
  }
  const panel = notification.origin.context?.panel;
  return isNotificationTargetPanel(panel) ? panel : undefined;
};

export const getNotificationTargetTag = (panel: NotificationTargetPanel) =>
  `target:${panel}` as const;

export const addNotificationTargetTag = (
  panel: NotificationTargetPanel,
  tags?: string[],
) => Array.from(new Set([getNotificationTargetTag(panel), ...(tags ?? [])]));

export const isNotificationForPanel = (
  notification: Notification,
  panel: NotificationTargetPanel,
  options?: { fallbackPanel?: NotificationTargetPanel },
) => {
  const fallbackPanel = options?.fallbackPanel ?? 'channel';
  const resolvedPanel = getNotificationTargetPanel(notification) ?? fallbackPanel;
  return resolvedPanel === panel;
};

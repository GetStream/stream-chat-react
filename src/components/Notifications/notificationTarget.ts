import type { Notification } from 'stream-chat';

const NOTIFICATION_TARGET_PANELS = [
  'channel',
  'thread',
  'channel-list',
  'thread-list',
  'modal',
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

/**
 * Panel implied by the composer that raised a notification. `stream-chat` cannot name a panel -- it
 * has no notion of one -- but every composer-scoped emitter puts the composer in `origin.context`,
 * and a thread composer's upload failure belongs in that thread rather than in the channel the
 * thread hangs off. Only the two contexts that correspond to a panel are mapped; `message` and
 * `legacy_thread` have none.
 */
const getPanelFromComposerContext = (
  notification: Notification,
): NotificationTargetPanel | undefined => {
  const composer = notification.origin.context?.composer as
    | { contextType?: unknown }
    | undefined;

  if (composer?.contextType === 'thread') return 'thread';
  if (composer?.contextType === 'channel') return 'channel';
  return undefined;
};

export const getNotificationTargetPanel = (
  notification: Notification,
): NotificationTargetPanel | undefined => {
  const targetTag = notification.tags?.find((tag) => tag.startsWith('target:'));
  if (targetTag) {
    const candidate = targetTag.slice('target:'.length);
    if (isNotificationTargetPanel(candidate)) return candidate;
  }
  const panel = notification.origin.context?.panel;
  if (isNotificationTargetPanel(panel)) return panel;
  return getPanelFromComposerContext(notification);
};

export const getNotificationTargetPanels = (
  notification: Notification,
): NotificationTargetPanel[] => {
  const targetPanels = (notification.tags ?? [])
    .filter((tag) => tag.startsWith('target:'))
    .map((tag) => tag.slice('target:'.length))
    .filter((value): value is NotificationTargetPanel =>
      isNotificationTargetPanel(value),
    );

  if (targetPanels.length > 0) {
    return Array.from(new Set(targetPanels));
  }

  const panel = notification.origin.context?.panel;
  if (isNotificationTargetPanel(panel)) return [panel];

  const composerPanel = getPanelFromComposerContext(notification);
  return composerPanel ? [composerPanel] : [];
};

export const getNotificationTargetTag = (panel: NotificationTargetPanel) =>
  `target:${panel}` as const;

export const addNotificationTargetTag = (
  panel: NotificationTargetPanel | undefined,
  tags?: string[],
) => {
  if (!panel) return tags ?? [];
  return Array.from(new Set([getNotificationTargetTag(panel), ...(tags ?? [])]));
};

export const isNotificationForPanel = (
  notification: Notification,
  panel: NotificationTargetPanel,
  options?: { fallbackPanel?: NotificationTargetPanel },
) => {
  const explicitTargetPanels = getNotificationTargetPanels(notification);
  if (explicitTargetPanels.length > 0) {
    return explicitTargetPanels.includes(panel);
  }

  const resolvedPanel = options?.fallbackPanel ?? 'channel';
  return resolvedPanel === panel;
};

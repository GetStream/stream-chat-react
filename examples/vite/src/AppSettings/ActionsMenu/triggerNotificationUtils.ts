import type { NotificationAction, NotificationSeverity } from 'stream-chat';
import type {
  NotificationListEnterFrom,
  NotificationTargetPanel,
} from 'stream-chat-react';

export const severityOptions = [
  'error',
  'warning',
  'info',
  'success',
  'loading',
] as const satisfies NotificationSeverity[];

export const entryDirectionOptions = [
  'bottom',
  'left',
  'right',
  'top',
] as const satisfies NotificationListEnterFrom[];

export const targetPanelOptions = [
  'channel',
  'thread',
  'channel-list',
  'thread-list',
] as const satisfies NotificationTargetPanel[];

export type NotificationDraft = {
  actionFeedback: string;
  actionLabel: string;
  duration: string;
  entryDirection: NotificationListEnterFrom | '';
  message: string;
  severity: NotificationSeverity | '';
  targetPanel: NotificationTargetPanel | '';
};

export type QueuedNotification = {
  actionFeedback: string;
  actionLabel: string;
  duration: number;
  entryDirection: NotificationListEnterFrom;
  id: string;
  message: string;
  severity: NotificationSeverity;
  targetPanel: NotificationTargetPanel;
};

export const initialDraft: NotificationDraft = {
  actionFeedback: '',
  actionLabel: '',
  duration: '5000',
  entryDirection: 'bottom',
  message: '',
  severity: 'info',
  targetPanel: 'channel',
};

export const parseDuration = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const isDraftReady = (draft: NotificationDraft) =>
  Boolean(
    draft.message.trim() &&
      draft.severity &&
      draft.entryDirection &&
      draft.targetPanel &&
      parseDuration(draft.duration) !== null,
  );

export const buildNotificationActions = (
  queuedNotification: QueuedNotification,
): NotificationAction[] | undefined => {
  if (!queuedNotification.actionLabel.trim()) return;

  return [
    {
      handler: () => {
        window.alert(
          queuedNotification.actionFeedback.trim() ||
            `${queuedNotification.actionLabel.trim()} clicked`,
        );
      },
      label: queuedNotification.actionLabel.trim(),
    },
  ];
};

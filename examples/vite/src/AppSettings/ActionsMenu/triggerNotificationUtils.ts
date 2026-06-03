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
  'modal',
] as const satisfies NotificationTargetPanel[];

export type NotificationDraftAction = {
  feedback: string;
  id: string;
  includedInPayload: boolean;
  label: string;
};

export type QueuedNotificationAction = {
  feedback: string;
  label: string;
};

export type NotificationDraft = {
  actions: NotificationDraftAction[];
  duration: string;
  entryDirection: NotificationListEnterFrom | '';
  message: string;
  severity: NotificationSeverity | '';
  targetPanels: NotificationTargetPanel[];
};

export type QueuedNotification = {
  actions: QueuedNotificationAction[];
  duration: number;
  entryDirection: NotificationListEnterFrom;
  id: string;
  message: string;
  severity: NotificationSeverity;
  targetPanels: NotificationTargetPanel[];
};

export const initialDraft: NotificationDraft = {
  actions: [],
  duration: '5000',
  entryDirection: 'bottom',
  message: 'This is a test notification',
  severity: 'info',
  targetPanels: ['channel'],
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
    draft.targetPanels.length > 0 &&
    parseDuration(draft.duration) !== null,
  );

export const buildNotificationActions = (
  queuedNotification: QueuedNotification,
): NotificationAction[] | undefined => {
  const actions = queuedNotification.actions
    .map((action) => ({
      feedback: action.feedback.trim(),
      label: action.label.trim(),
    }))
    .filter((action) => action.label);

  if (actions.length === 0) return;

  return actions.map((action) => ({
    handler: () => {
      window.alert(action.feedback || `${action.label} clicked`);
    },
    label: action.label,
  }));
};

import { useCallback } from 'react';

import type { Notification, NotificationAction, NotificationSeverity } from 'stream-chat';

import type { AriaLivePriority } from '../../Accessibility';
import { useChatContext, useModalDialogManager } from '../../../context';
import { useStateStore } from '../../../store';
import {
  addNotificationTargetTag,
  getNotificationTargetTag,
  type NotificationTargetPanel,
} from '../notificationTarget';
import { useNotificationTarget } from './useNotificationTarget';

import type { DialogManagerState } from '../../Dialog/service/DialogManager';

const modalDialogManagerStateSelector = ({
  dialogsById,
  openedDialogIds,
}: DialogManagerState) => ({
  hasOpenDialog: openedDialogIds
    ? openedDialogIds.length > 0
    : Object.values(dialogsById).some((dialog) => dialog.isOpen),
});

/** Tag of full-width system banners (e.g. connection status), which `NotificationList` excludes. */
export const SYSTEM_NOTIFICATION_TAG = 'system' as const;

export const hasSystemNotificationTag = (notification: Notification) =>
  notification.tags?.includes(SYSTEM_NOTIFICATION_TAG) ?? false;

export type NotificationIncidentDescriptor = {
  /** Where the incident happened (e.g. api, browser, validation, permission). */
  domain: string;
  /** Entity being operated on (e.g. message, poll, location, attachment). */
  entity: string;
  /** Attempted operation (e.g. send, end, share, upload). */
  operation: string;
  /** Status of the operation (e.g. failed, success, blocked). */
  status?: string;
};

export type AddNotificationParams = {
  /** Interactive actions rendered by the notification component. */
  actions?: NotificationAction[];
  /**
   * Overrides the aria-live priority the notification is announced with. Defaults to `assertive`
   * for `error` severity and `polite` otherwise. Use `assertive` for a confirmation that should be
   * heard promptly instead of queued behind a competing announcement (e.g. a focus change).
   */
  ariaLive?: AriaLivePriority;
  /** Arbitrary context metadata stored in `origin.context`. */
  context?: Record<string, unknown>;
  /** Duration in milliseconds after which the notification auto-dismisses. */
  duration?: number;
  /** Logical source emitting the notification (e.g. component or feature name). */
  emitter: string;
  /** Underlying error object attached as `options.originalError`. */
  error?: Error;
  /** Human-readable notification message. */
  message: string;
  /** Notification severity visualized by the UI. */
  severity?: NotificationSeverity;
  /** Additional tags appended to target panel tags. */
  tags?: string[];
  /** Explicit target panels; when provided, inferred panel is ignored. */
  targetPanels?: NotificationTargetPanel[];
  /** Structured descriptor of the incident this notification reports on. */
  incident?: NotificationIncidentDescriptor;
  /**
   * Machine-readable type identifier (`domain:entity:operation:status`), used by consumers to route
   * behavior, including translation lookup. Generated from `incident` when omitted and `incident`
   * is provided.
   */
  type?: string;
};

/**
 * {@link AddNotificationParams} without `targetPanels`: system banners are global and get the
 * `system` tag instead of `target:*` panel tags.
 */
export type AddSystemNotificationParams = Omit<AddNotificationParams, 'targetPanels'>;

export type AddNotification = (params: AddNotificationParams) => void;
/** Returns the notification ID, for removal and timeouts. */
export type AddSystemNotification = (params: AddSystemNotificationParams) => string;
export type RemoveNotification = (id: string) => void;
export type StartNotificationTimeout = (id: string) => void;
/** Starts a notification's countdown unless one is already running. */
export type EnsureNotificationTimeout = (id: string) => void;

export type NotificationApi = {
  addNotification: AddNotification;
  addSystemNotification: AddSystemNotification;
  ensureNotificationTimeout: EnsureNotificationTimeout;
  removeNotification: RemoveNotification;
  startNotificationTimeout: StartNotificationTimeout;
};

const getTargetTags = (
  targetPanels: NotificationTargetPanel[] | undefined,
  inferredPanel: NotificationTargetPanel | undefined,
  tags: string[] | undefined,
  modalManagerHasOpenDialog: boolean,
) => {
  if (targetPanels) {
    const effectiveTargetPanels =
      modalManagerHasOpenDialog && targetPanels.length > 0
        ? [...targetPanels, 'modal' as const]
        : targetPanels;

    return Array.from(
      new Set([...effectiveTargetPanels.map(getNotificationTargetTag), ...(tags ?? [])]),
    );
  }

  if (modalManagerHasOpenDialog) {
    return Array.from(
      new Set([
        ...(inferredPanel ? [getNotificationTargetTag(inferredPanel)] : []),
        getNotificationTargetTag('modal'),
        ...(tags ?? []),
      ]),
    );
  }

  return addNotificationTargetTag(inferredPanel, tags);
};

const getTypeFromIncident = ({
  incident,
  severity,
  type,
}: Pick<AddNotificationParams, 'incident' | 'severity' | 'type'>) => {
  if (type) return type;
  if (!incident) return undefined;

  const status =
    incident.status ??
    (severity === 'error' ? 'failed' : severity === 'success' ? 'success' : severity);

  return [incident.domain, incident.entity, incident.operation, status]
    .filter((segment): segment is string => !!segment)
    .join(':');
};

export const useNotificationApi = (): NotificationApi => {
  const { client } = useChatContext();
  const inferredPanel = useNotificationTarget();
  const modalDialogManager = useModalDialogManager();
  const modalManagerHasOpenDialog =
    useStateStore(modalDialogManager?.state, modalDialogManagerStateSelector)
      ?.hasOpenDialog ?? false;

  const addNotification: AddNotification = useCallback(
    ({
      actions,
      ariaLive,
      context,
      duration,
      emitter,
      error,
      incident,
      message,
      severity,
      tags,
      targetPanels,
      type,
    }: AddNotificationParams) => {
      const notificationTags = getTargetTags(
        targetPanels,
        inferredPanel,
        tags,
        modalManagerHasOpenDialog,
      );
      const resolvedType = getTypeFromIncident({ incident, severity, type });
      const origin = context ? { context, emitter } : { emitter };

      const options = {
        ...(actions ? { actions } : {}),
        ...(typeof duration === 'number' ? { duration } : {}),
        ...(error ? { originalError: error } : {}),
        ...(ariaLive ? { metadata: { ariaLive } } : {}),
        ...(notificationTags.length > 0 ? { tags: notificationTags } : {}),
        ...(severity ? { severity } : {}),
        ...(resolvedType ? { type: resolvedType } : {}),
      };

      client.notifications.add({
        message,
        options,
        origin,
      });
    },
    [client, inferredPanel, modalManagerHasOpenDialog],
  );

  const addSystemNotification: AddSystemNotification = useCallback(
    ({
      actions,
      ariaLive,
      context,
      duration,
      emitter,
      error,
      incident,
      message,
      severity,
      tags,
      type,
    }: AddSystemNotificationParams) => {
      const notificationTags = Array.from(
        new Set([SYSTEM_NOTIFICATION_TAG, ...(tags ?? [])]),
      );
      const resolvedType = getTypeFromIncident({ incident, severity, type });
      const origin = context ? { context, emitter } : { emitter };

      const options = {
        ...(actions ? { actions } : {}),
        ...(typeof duration === 'number' ? { duration } : {}),
        ...(error ? { originalError: error } : {}),
        ...(ariaLive ? { metadata: { ariaLive } } : {}),
        ...(notificationTags.length > 0 ? { tags: notificationTags } : {}),
        ...(severity ? { severity } : {}),
        ...(resolvedType ? { type: resolvedType } : {}),
      };

      return client.notifications.add({
        message,
        options,
        origin,
      });
    },
    [client],
  );

  const removeNotification: RemoveNotification = useCallback(
    (id) => {
      client.notifications.remove(id);
    },
    [client],
  );

  const startNotificationTimeout: StartNotificationTimeout = useCallback(
    (id) => {
      client.notifications.startTimeout(id);
    },
    [client],
  );

  // Idempotency lives in the manager: a caller that cannot know whether the countdown is already
  // running (e.g. a remounted component) would otherwise reset the notification's deadline.
  const ensureNotificationTimeout: EnsureNotificationTimeout = useCallback(
    (id) => {
      client.notifications.ensureTimeout(id);
    },
    [client],
  );

  return {
    addNotification,
    addSystemNotification,
    ensureNotificationTimeout,
    removeNotification,
    startNotificationTimeout,
  };
};

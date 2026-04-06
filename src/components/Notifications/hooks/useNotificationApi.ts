import { useCallback } from 'react';

import type { NotificationAction, NotificationSeverity } from 'stream-chat';

import { useChatContext } from '../../../context';
import {
  addNotificationTargetTag,
  getNotificationTargetTag,
  type NotificationTargetPanel,
} from '../notificationTarget';
import { useNotificationTarget } from './useNotificationTarget';

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
  /** Optional interactive actions rendered by the notification component. */
  actions?: NotificationAction[];
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
   * Optional machine-readable notification type identifier (domain:entity:operation:status).
   * Used by notification consumers to route behavior, including translation lookup
   * via notification-type registries.
   * When omitted, `type` is generated from `incident` if `incident` is provided.
   */
  type?: string;
};

export type AddNotification = (params: AddNotificationParams) => void;

export type NotificationApi = {
  addNotification: AddNotification;
};

const getTargetTags = (
  targetPanels: NotificationTargetPanel[] | undefined,
  inferredPanel: NotificationTargetPanel | undefined,
  tags: string[] | undefined,
) => {
  if (targetPanels) {
    return Array.from(
      new Set([...targetPanels.map(getNotificationTargetTag), ...(tags ?? [])]),
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

  const addNotification: AddNotification = useCallback(
    ({
      actions,
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
      const notificationTags = getTargetTags(targetPanels, inferredPanel, tags);
      const resolvedType = getTypeFromIncident({ incident, severity, type });
      const origin = context ? { context, emitter } : { emitter };

      const options = {
        ...(actions ? { actions } : {}),
        ...(typeof duration === 'number' ? { duration } : {}),
        ...(error ? { originalError: error } : {}),
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
    [client, inferredPanel],
  );

  return { addNotification };
};

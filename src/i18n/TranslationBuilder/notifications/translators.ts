import {
  CORE_NOTIFICATION_TYPE,
  ScheduledMessageCompositionEndReason,
} from 'stream-chat';
import type { Notification } from 'stream-chat';

import { translateScheduledMessageError } from '../../../components/ScheduledMessages/utils';
import type { NotificationTranslatorOptions } from './types';
import type { Translator } from '../../index';

const normalizeReason = (notification?: Notification) => {
  const reason = notification?.metadata?.reason;
  if (typeof reason !== 'string' || !reason.length) return undefined;
  return reason.toLowerCase();
};

export const translateAttachmentUploadBlocked: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const rawReason = notification?.metadata?.reason;
  let reason = t('notification.reason.unsupportedFileType', 'unsupported file type');
  if (typeof rawReason !== 'string')
    reason = t('notification.reason.unknownError', 'unknown error');
  if (rawReason === 'size_limit')
    reason = t('notification.reason.sizeLimit', 'size limit');
  return t(
    'notification.attachmentUploadBlockedWithReason',
    'Attachment upload blocked due to {{reason}}',
    { reason },
  );
};

// The reason and fallback `t()` calls below are spelled out instead of built by a helper: the key
// extractor only sees keys that appear literally in a `t()` call.
export const translateAttachmentUploadFailed: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const reason = normalizeReason(notification);
  return reason
    ? t(
        'notification.attachmentUploadFailedWithReason',
        'Attachment upload failed due to {{reason}}',
        { reason },
      )
    : t('notification.attachmentUploadFailed', 'Error uploading attachment');
};

export const translatePollCreateFailed: Translator<NotificationTranslatorOptions> = ({
  options: { notification },
  t,
}) => {
  const reason = normalizeReason(notification);
  return reason
    ? t(
        'notification.pollCreateFailedWithReason',
        'Failed to create the poll due to {{reason}}',
        { reason },
      )
    : t('notification.pollCreateFailed', 'Failed to create the poll');
};

export const translatePollEndFailed: Translator<NotificationTranslatorOptions> = ({
  options: { notification },
  t,
}) => {
  const reason = normalizeReason(notification);
  return reason
    ? t(
        'notification.pollEndFailedWithReason',
        'Failed to end the poll due to {{reason}}',
        { reason },
      )
    : t('notification.pollEndFailed', 'Failed to end the poll');
};

export const translateBrowserAudioPlaybackError: Translator<
  NotificationTranslatorOptions
> = ({ t }) => t('notification.audioPlaybackError', 'Error reproducing the recording');

export const translateCommandDisabled: Translator<NotificationTranslatorOptions> = ({
  options: { notification },
  t,
}) => {
  const reason = normalizeReason(notification);

  if (reason === 'editing') {
    return t(
      'notification.commandDisabledWhileEditing',
      'Command not available while editing',
    );
  }

  if (reason === 'quoted_message') {
    return t(
      'notification.commandDisabledWhileReplying',
      'Command not available while replying',
    );
  }

  return t('notification.commandDisabled', 'Command not available');
};

/** A failed request to schedule or edit a scheduled message, both emitted by the composer. */
export const translateScheduledMessageRequestFailed: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const specific = translateScheduledMessageError(t, notification?.originalError);
  if (specific) return specific;
  switch (notification?.type) {
    case CORE_NOTIFICATION_TYPE.scheduledMessageCreateFailed:
      return t(
        'scheduledMessages.couldntScheduleMessageTryAgain',
        "Couldn't schedule message. Try again",
      );
    default:
      return t(
        'scheduledMessages.notification.updateFailed',
        "Couldn't update the scheduled message. Try again",
      );
  }
};

/** A scheduled message open in the composer was sent, deleted or failed meanwhile. */
export const translateScheduledMessageCompositionEnded: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) =>
  notification?.metadata?.reason === ScheduledMessageCompositionEndReason.Sent
    ? t('scheduledMessages.notification.alreadySentEdit', 'This message was already sent')
    : t(
        'scheduledMessages.notification.endedEdit',
        'This scheduled message can no longer be edited',
      );

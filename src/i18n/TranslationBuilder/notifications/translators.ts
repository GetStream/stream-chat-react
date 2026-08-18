import type { Notification } from 'stream-chat';

import { translateExternalString } from '../../externalStrings';
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

// The reason-or-fallback pairs below are written out at each call site rather than routed
// through a helper: the extractor only sees keys that appear literally in a `t()` call.
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
> = ({ options: { notification }, t }) =>
  notification?.message
    ? translateExternalString(t, notification.message)
    : t('notification.audioPlaybackError', 'Error reproducing the recording');

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

  return notification?.message
    ? translateExternalString(t, notification.message)
    : t('notification.commandDisabled', 'Command not available');
};

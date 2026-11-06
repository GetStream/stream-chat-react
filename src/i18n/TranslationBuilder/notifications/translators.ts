import {
  getScheduledMessageErrorReason,
  isScheduledMessageNotFoundError,
  ScheduledMessageBlockReason,
  ScheduledMessageCompositionEndReason,
  ScheduledMessageErrorReason,
  StreamAPIError,
} from 'stream-chat';
import type { Notification, ScheduledMessageFailureReason } from 'stream-chat';

import { ScheduledMessageNotificationType } from '../../../components/ScheduledMessages/constants';
import { translateScheduledMessageFailureReason } from '../../../components/ScheduledMessages/utils/scheduledMessageFailureReason';

import type { NotificationTranslatorOptions } from './types';
import type { Translator } from '../../index';
import type { StreamTFunction } from '../../types';

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

const FORBIDDEN_STATUS = 403;

const isForbiddenError = (error?: unknown) =>
  error instanceof StreamAPIError && error.status === FORBIDDEN_STATUS;

export const translateScheduledMessageCreateFailed: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const error = notification?.originalError;
  const reason = getScheduledMessageErrorReason(error);

  if (reason === ScheduledMessageErrorReason.Disabled) {
    return t(
      'scheduledMessages.notification.disabled',
      'Scheduled messages are turned off',
    );
  }

  if (reason === ScheduledMessageErrorReason.TooSoon) {
    return t('scheduledMessages.chooseALaterTime', 'Choose a later time');
  }

  if (reason === ScheduledMessageErrorReason.TooFar) {
    return t('scheduledMessages.chooseAnEarlierTime', 'Choose an earlier time');
  }

  if (reason === ScheduledMessageErrorReason.ChannelLimit) {
    return t(
      'scheduledMessages.notification.channelLimit',
      "You've reached the limit of scheduled messages in this channel",
    );
  }

  if (reason === ScheduledMessageErrorReason.UserLimit) {
    return t(
      'scheduledMessages.notification.userLimit',
      "You've reached the limit of scheduled messages",
    );
  }

  if (isForbiddenError(error)) {
    return t(
      'scheduledMessages.notification.forbidden',
      "You can't schedule messages here",
    );
  }

  return t(
    'scheduledMessages.couldntScheduleMessageTryAgain',
    "Couldn't schedule message. Try again",
  );
};

export const translateScheduledMessageBlocked: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const { reason } = notification?.metadata ?? {};

  if (reason === ScheduledMessageBlockReason.Command) {
    return t(
      'scheduledMessages.notification.commandBlocked',
      "Slash commands can't be scheduled",
    );
  }

  if (reason === ScheduledMessageBlockReason.Poll) {
    return t('scheduledMessages.notification.pollBlocked', "Polls can't be scheduled");
  }

  if (reason === ScheduledMessageBlockReason.SharedLocation) {
    return t(
      'scheduledMessages.notification.locationBlocked',
      "Locations can't be scheduled",
    );
  }

  return t('scheduledMessages.notification.blocked', "This message can't be scheduled");
};

const translateScheduledMessageActionFallback = (t: StreamTFunction, type?: string) => {
  if (type === ScheduledMessageNotificationType.RescheduleFailed) {
    return t(
      'scheduledMessages.couldntRescheduleTheMessageTryAgain',
      "Couldn't reschedule the message. Try again",
    );
  }

  if (type === ScheduledMessageNotificationType.SendNowFailed) {
    return t(
      'scheduledMessages.notification.sendNowFailed',
      "Couldn't send the message. Try again",
    );
  }

  if (type === ScheduledMessageNotificationType.DeleteFailed) {
    return t(
      'scheduledMessages.notification.deleteFailed',
      "Couldn't delete the scheduled message. Try again",
    );
  }

  return t(
    'scheduledMessages.notification.updateFailed',
    "Couldn't update the scheduled message. Try again",
  );
};

export const translateScheduledMessageActionFailed: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const error = notification?.originalError;
  const reason = getScheduledMessageErrorReason(error);

  if (isScheduledMessageNotFoundError(error)) {
    return t('scheduledMessages.notification.alreadySent', 'Already sent');
  }

  if (reason === ScheduledMessageErrorReason.Sending) {
    return t('scheduledMessages.notification.sending', 'This message is being sent');
  }

  if (reason === ScheduledMessageErrorReason.Conflict) {
    return t('scheduledMessages.notification.conflict', 'Updated elsewhere. Try again');
  }

  if (reason === ScheduledMessageErrorReason.NotEditable) {
    return t(
      'scheduledMessages.notification.notEditable',
      "Failed messages can't be edited",
    );
  }

  if (reason === ScheduledMessageErrorReason.TooSoon) {
    return t('scheduledMessages.chooseALaterTime', 'Choose a later time');
  }

  if (reason === ScheduledMessageErrorReason.TooFar) {
    return t('scheduledMessages.chooseAnEarlierTime', 'Choose an earlier time');
  }

  if (isForbiddenError(error)) {
    return t(
      'scheduledMessages.notification.forbidden',
      "You can't schedule messages here",
    );
  }

  return translateScheduledMessageActionFallback(t, notification?.type);
};

export const translateScheduledMessageSendFailed: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const { reason } = notification?.metadata ?? {};
  const reasonCopy = translateScheduledMessageFailureReason(
    t,
    reason as ScheduledMessageFailureReason | undefined,
  );

  if (!reasonCopy) {
    return t('scheduledMessages.notification.notSent', 'Scheduled message not sent');
  }

  return t(
    'scheduledMessages.notification.notSentWithReason',
    'Scheduled message not sent: {{ reason }}',
    { reason: reasonCopy },
  );
};

export const translateScheduledMessageCompositionEnded: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const { reason } = notification?.metadata ?? {};

  if (reason === ScheduledMessageCompositionEndReason.Sent) {
    return t(
      'scheduledMessages.notification.alreadySentEdit',
      'This message was already sent',
    );
  }

  if (reason === ScheduledMessageCompositionEndReason.Deleted) {
    return t(
      'scheduledMessages.notification.deletedEdit',
      'This scheduled message was deleted',
    );
  }

  if (reason === ScheduledMessageCompositionEndReason.Failed) {
    return t(
      'scheduledMessages.notification.failedEdit',
      'This scheduled message failed to send',
    );
  }

  return t(
    'scheduledMessages.notification.endedEdit',
    'This scheduled message can no longer be edited',
  );
};

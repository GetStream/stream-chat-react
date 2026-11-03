import {
  ErrorFromResponse,
  getScheduledMessageErrorReason,
  isScheduledMessageNotFoundError,
  ScheduledMessageBlockReason,
  ScheduledMessageCompositionEndReason,
  ScheduledMessageErrorReason,
} from 'stream-chat';
import type { Notification } from 'stream-chat';

import { ScheduledMessageNotificationType } from '../../../components/ScheduledMessages/constants';

import type { NotificationTranslatorOptions } from './types';
import type { TranslationTopicOptions, Translator } from '../../index';

const normalizeReason = (notification?: Notification) => {
  const reason = notification?.metadata?.reason;
  if (typeof reason !== 'string' || !reason.length) return undefined;
  return reason.toLowerCase();
};

const withReasonFallback = ({
  fallbackTranslationKey,
  notification,
  reasonTranslationKey,
  t,
}: {
  fallbackTranslationKey: string;
  notification?: Notification;
  reasonTranslationKey: string;
  t: TranslationTopicOptions['i18next']['t'];
}) => {
  const reason = normalizeReason(notification);
  if (!reason) return t(fallbackTranslationKey);
  return t(reasonTranslationKey, { reason });
};

export const translateAttachmentUploadBlocked: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const rawReason = notification?.metadata?.reason;
  let reason = t('unsupported file type');
  if (typeof rawReason !== 'string') reason = t('unknown error');
  if (rawReason === 'size_limit') reason = t('size limit');
  return t('Attachment upload blocked due to {{reason}}', { reason });
};

export const translateAttachmentUploadFailed: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) =>
  withReasonFallback({
    fallbackTranslationKey: 'Error uploading attachment',
    notification,
    reasonTranslationKey: 'Attachment upload failed due to {{reason}}',
    t,
  });

export const translatePollCreateFailed: Translator<NotificationTranslatorOptions> = ({
  options: { notification },
  t,
}) =>
  withReasonFallback({
    fallbackTranslationKey: 'Failed to create the poll',
    notification,
    reasonTranslationKey: 'Failed to create the poll due to {{reason}}',
    t,
  });

export const translatePollEndFailed: Translator<NotificationTranslatorOptions> = ({
  options: { notification },
  t,
}) =>
  withReasonFallback({
    fallbackTranslationKey: 'Failed to end the poll',
    notification,
    reasonTranslationKey: 'Failed to end the poll due to {{reason}}',
    t,
  });

export const translateBrowserAudioPlaybackError: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) =>
  notification?.message ? t(notification.message) : t('Error reproducing the recording');

export const translateCommandDisabled: Translator<NotificationTranslatorOptions> = ({
  options: { notification },
  t,
}) => {
  const reason = normalizeReason(notification);

  if (reason === 'editing') {
    return t('Command not available while editing');
  }

  if (reason === 'quoted_message') {
    return t('Command not available while replying');
  }

  return t(notification?.message || 'Command not available');
};

const FORBIDDEN_STATUS = 403;

const isForbiddenError = (error?: Error) =>
  error instanceof ErrorFromResponse && error.status === FORBIDDEN_STATUS;

export const translateScheduledMessageCreateFailed: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const error = notification?.originalError;
  const reason = error ? getScheduledMessageErrorReason(error) : undefined;

  if (reason === ScheduledMessageErrorReason.Disabled) {
    return t('Scheduled messages are turned off');
  }

  if (reason === ScheduledMessageErrorReason.TooSoon) return t('Choose a later time');

  if (reason === ScheduledMessageErrorReason.TooFar) return t('Choose an earlier time');

  if (reason === ScheduledMessageErrorReason.ChannelLimit) {
    return t("You've reached the limit of scheduled messages in this channel");
  }

  if (reason === ScheduledMessageErrorReason.UserLimit) {
    return t("You've reached the limit of scheduled messages");
  }

  if (isForbiddenError(error)) return t("You can't schedule messages here");

  return t("Couldn't schedule message. Try again");
};

export const translateScheduledMessageBlocked: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const { reason } = notification?.metadata ?? {};

  if (reason === ScheduledMessageBlockReason.Command) {
    return t("Slash commands can't be scheduled");
  }

  if (reason === ScheduledMessageBlockReason.Poll) return t("Polls can't be scheduled");

  if (reason === ScheduledMessageBlockReason.SharedLocation) {
    return t("Locations can't be scheduled");
  }

  return t("This message can't be scheduled");
};

const translateScheduledMessageActionFallback = (
  t: TranslationTopicOptions['i18next']['t'],
  type?: string,
) => {
  if (type === ScheduledMessageNotificationType.RescheduleFailed) {
    return t("Couldn't reschedule the message. Try again");
  }

  if (type === ScheduledMessageNotificationType.SendNowFailed) {
    return t("Couldn't send the message. Try again");
  }

  if (type === ScheduledMessageNotificationType.DeleteFailed) {
    return t("Couldn't delete the scheduled message. Try again");
  }

  return t("Couldn't update the scheduled message. Try again");
};

export const translateScheduledMessageActionFailed: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const error = notification?.originalError;
  const reason = error ? getScheduledMessageErrorReason(error) : undefined;

  if (error && isScheduledMessageNotFoundError(error)) return t('Already sent');

  if (reason === ScheduledMessageErrorReason.Sending) {
    return t('This message is being sent');
  }

  if (reason === ScheduledMessageErrorReason.Conflict) {
    return t('Updated elsewhere. Try again');
  }

  if (reason === ScheduledMessageErrorReason.NotEditable) {
    return t("Failed messages can't be edited");
  }

  if (reason === ScheduledMessageErrorReason.TooSoon) return t('Choose a later time');

  if (reason === ScheduledMessageErrorReason.TooFar) return t('Choose an earlier time');

  if (isForbiddenError(error)) return t("You can't schedule messages here");

  return translateScheduledMessageActionFallback(t, notification?.type);
};

export const translateScheduledMessageCompositionEnded: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  const { reason } = notification?.metadata ?? {};

  if (reason === ScheduledMessageCompositionEndReason.Sent) {
    return t('This message was already sent');
  }

  if (reason === ScheduledMessageCompositionEndReason.Deleted) {
    return t('This scheduled message was deleted');
  }

  if (reason === ScheduledMessageCompositionEndReason.Failed) {
    return t('This scheduled message failed to send');
  }

  return t('This scheduled message can no longer be edited');
};

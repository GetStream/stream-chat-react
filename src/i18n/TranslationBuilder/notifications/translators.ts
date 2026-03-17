import type { Notification } from 'stream-chat';

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

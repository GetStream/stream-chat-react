import type { NotificationTranslatorOptions } from './types';
import type { Translator } from '../TranslationBuilder';

export const attachmentUploadBlockedNotificationTranslator: Translator<
  NotificationTranslatorOptions
> = ({ options, t }) => {
  const { notification } = options;
  if (!notification) return null;
  if (typeof notification.metadata?.reason !== 'string') {
    const reason = t('unknown error');
    return t('Attachment upload blocked due to {{reason}}', { reason });
  }
  if (notification.metadata?.reason === 'size_limit') {
    const reason = t('size limit');
    return t('Attachment upload blocked due to {{reason}}', { reason });
  }
  const reason = t('unsupported file type');
  return t('Attachment upload blocked due to {{reason}}', { reason });
};

export const attachmentUploadFailedNotificationTranslator: Translator<
  NotificationTranslatorOptions
> = ({ options, t }) => {
  const { notification } = options;
  if (!notification) return null;
  const { reason: originalReason } = notification.metadata ?? {};
  if (typeof originalReason !== 'string') {
    const reason = t('unknown error');
    return t('Attachment upload failed due to {{reason}}', { reason });
  }
  let reason = originalReason.toLowerCase();
  if (reason === 'network error') {
    reason = t('network error');
    return t('Attachment upload failed due to {{reason}}', { reason });
  }
  // custom reason string
  return t('Attachment upload failed due to {{reason}}', { reason });
};

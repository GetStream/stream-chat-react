import type { NotificationTranslatorOptions } from './types';
import type { Translator } from '../TranslationBuilder';

export const attachmentUploadBlockedNotificationTranslator: Translator<
  NotificationTranslatorOptions
> = ({ options, t }) => {
  const { notification } = options;
  if (!notification) return null;
  if (typeof notification.metadata?.reason !== 'string') {
    const reason = t<string>('unknown error');
    return t<string>('Attachment upload blocked due to {{reason}}', { reason });
  }
  if (notification.metadata?.reason === 'size_limit') {
    const reason = t<string>('size limit');
    return t<string>('Attachment upload blocked due to {{reason}}', { reason });
  }
  const reason = t<string>('unsupported file type');
  return t<string>('Attachment upload blocked due to {{reason}}', { reason });
};

export const attachmentUploadFailedNotificationTranslator: Translator<
  NotificationTranslatorOptions
> = ({ options, t }) => {
  const { notification } = options;
  if (!notification) return null;
  const { reason: originalReason } = notification.metadata ?? {};
  if (typeof originalReason !== 'string') {
    const reason = t<string>('unknown error');
    return t<string>('Attachment upload failed due to {{reason}}', { reason });
  }
  let reason = originalReason.toLowerCase();
  if (reason === 'network error') {
    reason = t<string>('network error');
    return t<string>('Attachment upload failed due to {{reason}}', { reason });
  }
  // custom reason string
  return t<string>('Attachment upload failed due to {{reason}}', { reason });
};

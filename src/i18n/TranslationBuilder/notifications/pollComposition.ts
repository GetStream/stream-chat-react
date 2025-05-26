import type { Translator } from '../TranslationBuilder';
import type { NotificationTranslatorOptions } from './types';

export const pollCreationFailedNotificationTranslator: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  if (
    typeof notification?.metadata?.reason === 'string' &&
    notification.metadata.reason.length
  ) {
    return t('Failed to create the poll due to {{reason}}', {
      reason: notification.metadata.reason.toLowerCase(),
    });
  }
  return t('Failed to create the poll');
};

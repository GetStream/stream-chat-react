import type { Translator } from '../TranslationBuilder';
import type { NotificationTranslatorOptions } from './types';

export const pollEndFailedNotificationTranslator: Translator<
  NotificationTranslatorOptions
> = ({ options: { notification }, t }) => {
  if (
    typeof notification?.metadata?.reason === 'string' &&
    notification.metadata.reason.length
  ) {
    return t('Failed to end the poll due to {{reason}}', {
      reason: notification.metadata.reason.toLowerCase(),
    });
  }
  return t('Failed to end the poll');
};

export const pollEndSucceededNotificationTranslator: Translator<
  NotificationTranslatorOptions
> = ({ t }) => t('Poll ended');

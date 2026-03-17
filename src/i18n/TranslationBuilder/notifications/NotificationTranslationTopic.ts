import { TranslationTopic } from '../../TranslationBuilder';
import type { Notification } from 'stream-chat';
import type { NotificationTranslatorOptions } from './types';
import { translatorsByNotificationType } from './translatorsByNotificationType';
import type { TranslationTopicOptions, Translator } from '../../index';

const translateByNotificationType: Translator<NotificationTranslatorOptions> = ({
  options: { notification },
  ...params
}) => {
  if (!notification?.type) return null;
  const translator = translatorsByNotificationType[notification.type];
  if (!translator) return null;
  return translator({ ...params, options: { notification } });
};

export const defaultNotificationTranslators: Record<
  string,
  Translator<NotificationTranslatorOptions>
> = {
  '*': translateByNotificationType,
};

export class NotificationTranslationTopic extends TranslationTopic<NotificationTranslatorOptions> {
  constructor({ i18next, translators }: TranslationTopicOptions) {
    super({ i18next, translators: defaultNotificationTranslators });
    if (translators) {
      Object.entries(translators).forEach(([name, translator]) => {
        this.setTranslator(name, translator);
      });
    }
  }

  translate = (value: string, key: string, options: { notification?: Notification }) => {
    const { notification } = options;
    if (!notification) return value;
    const byType = notification.type
      ? this.translators.get(notification.type)
      : undefined;
    if (byType) return byType({ key, options, t: this.i18next.t, value }) || value;

    const byFallback = this.translators.get('*');
    const translated = byFallback?.({ key, options, t: this.i18next.t, value }) ?? null;
    if (translated) return translated;
    if (!notification.message) return value;

    // Final fallback: attempt to translate message as natural key.
    return this.i18next.t(notification.message, {
      ...(notification.metadata ?? {}),
      value: notification.message,
    });
  };
}

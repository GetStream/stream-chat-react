import { TranslationTopic } from '../../TranslationBuilder';
import type { Notification } from 'stream-chat';
import type { NotificationTranslatorOptions } from './types';
import { translatorsByNotificationType } from './translatorsByNotificationType';
import type { TranslationTopicOptions, Translator } from '../../index';
import type { StreamTFunction } from '../../types';

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
    // i18next's `TFunction` is untyped; the translators take the SDK's `StreamTFunction`.
    const t = this.i18next.t as unknown as StreamTFunction;
    if (!notification) return value;
    const byType = notification.type
      ? this.translators.get(notification.type)
      : undefined;
    if (byType) return byType({ key, options, t, value }) || value;

    const byFallback = this.translators.get('*');
    const translated = byFallback?.({ key, options, t, value }) ?? null;
    if (translated) return translated;
    if (!notification.message) return value;

    // No translator claims this type (e.g. a newer `stream-chat` or integrator code): render the
    // English message rather than a blank or a raw dotted key.
    return notification.message;
  };
}

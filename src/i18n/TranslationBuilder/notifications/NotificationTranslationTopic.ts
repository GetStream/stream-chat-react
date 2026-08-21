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
    // i18next hands over its own untyped `TFunction`; the translators take the SDK's narrowed
    // `StreamTFunction`. Narrowed once here rather than at each of the four use sites below.
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

    // Final fallback for an identifier no translator claims -- a newer `stream-chat`, or one emitted
    // by integrator code. Render the English message rather than a blank or a raw dotted key.
    //
    // This used to run the message through a hand-maintained table of English sentences mapped onto
    // keys. That table is gone: identifiers are the seam now, so prose matching would only mask a
    // missing translator entry.
    return notification.message;
  };
}

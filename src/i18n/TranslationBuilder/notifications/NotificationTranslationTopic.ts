import {
  attachmentUploadBlockedNotificationTranslator,
  attachmentUploadFailedNotificationTranslator,
} from './attachmentUpload';
import { TranslationTopic } from '../../index';
import type { Notification } from 'stream-chat';
import type { NotificationTranslatorOptions } from './types';
import type { TranslationTopicOptions, Translator } from '../../index';

export const defaultNotificationTranslators: Record<
  string,
  Translator<NotificationTranslatorOptions>
> = {
  'attachment.upload.blocked': attachmentUploadBlockedNotificationTranslator,
  'attachment.upload.failed': attachmentUploadFailedNotificationTranslator,
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
    const translator = notification.code && this.translators.get(notification.code);
    if (!translator) return value;
    return translator({ key, options, t: this.i18next.t, value }) || value;
  };
}

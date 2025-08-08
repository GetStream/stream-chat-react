import {
  attachmentUploadBlockedNotificationTranslator,
  attachmentUploadFailedNotificationTranslator,
} from './attachmentUpload';
import { TranslationTopic } from '../../TranslationBuilder';
import type { Notification } from 'stream-chat';
import type { NotificationTranslatorOptions } from './types';
import type { TranslationTopicOptions, Translator } from '../../index';
import { pollCreationFailedNotificationTranslator } from './pollComposition';
import { pollVoteCountTrespass } from './pollVoteCountTrespass';

export const defaultNotificationTranslators: Record<
  string,
  Translator<NotificationTranslatorOptions>
> = {
  'api:attachment:upload:failed': attachmentUploadFailedNotificationTranslator,
  'api:poll:create:failed': pollCreationFailedNotificationTranslator,
  'validation:attachment:upload:blocked': attachmentUploadBlockedNotificationTranslator,
  'validation:poll:castVote:limit': pollVoteCountTrespass,
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
    const translator = notification.type && this.translators.get(notification.type);
    if (!translator) return value;
    return translator({ key, options, t: this.i18next.t, value }) || value;
  };
}

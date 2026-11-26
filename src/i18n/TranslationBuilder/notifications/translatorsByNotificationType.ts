import { CORE_NOTIFICATION_TYPE } from 'stream-chat';
import type { CoreNotificationType } from 'stream-chat';

import type { NotificationTranslatorOptions } from './types';
import {
  translateAttachmentUploadBlocked,
  translateAttachmentUploadFailed,
  translateBrowserAudioPlaybackError,
  translateCommandDisabled,
  translatePollCreateFailed,
  translatePollEndFailed,
  translateScheduledMessageCompositionEnded,
  translateScheduledMessageRequestFailed,
} from './translators';
import type { Translator } from '../../index';

type NotificationTranslator = Translator<NotificationTranslatorOptions>;

/**
 * A translator for every notification `stream-chat` itself emits. The
 * `Record<CoreNotificationType, ...>` type fails to compile when core adds an unmapped identifier
 * or an entry names one it lacks.
 */
const coreNotificationTranslators: Record<CoreNotificationType, NotificationTranslator> =
  {
    [CORE_NOTIFICATION_TYPE.attachmentFileMissing]: ({ t }) =>
      t('notification.attachmentFileMissing', 'File is required for upload attachment'),
    [CORE_NOTIFICATION_TYPE.attachmentIdMissing]: ({ t }) =>
      t('notification.attachmentIdMissing', 'Local upload attachment missing local id'),
    [CORE_NOTIFICATION_TYPE.attachmentUploadBlocked]: translateAttachmentUploadBlocked,
    [CORE_NOTIFICATION_TYPE.attachmentUploadFailed]: translateAttachmentUploadFailed,
    [CORE_NOTIFICATION_TYPE.attachmentUploadInProgress]: ({ t }) =>
      t(
        'notification.attachmentUploadInProgress',
        'Wait until all attachments have uploaded',
      ),
    [CORE_NOTIFICATION_TYPE.commandDisabled]: translateCommandDisabled,
    [CORE_NOTIFICATION_TYPE.commandNotReady]: ({ t }) =>
      t('notification.commandNotReady', 'Command not ready to be sent'),
    [CORE_NOTIFICATION_TYPE.locationCreateFailed]: ({ t }) =>
      t('notification.locationShareFailed', 'Failed to share location'),
    [CORE_NOTIFICATION_TYPE.messageJumpFailed]: ({ t }) =>
      t('notification.messageJumpFailed', 'Failed to jump to the message'),
    [CORE_NOTIFICATION_TYPE.messageJumpToLatestFailed]: ({ t }) =>
      t('notification.messageJumpToLatestFailed', 'Failed to jump to the latest message'),
    [CORE_NOTIFICATION_TYPE.messageSendFailed]: ({ t }) =>
      t('notification.messageSendFailed', 'Send message request failed'),
    [CORE_NOTIFICATION_TYPE.messageUpdateFailed]: ({ t }) =>
      t('notification.messageUpdateFailed', 'Edit message request failed'),
    [CORE_NOTIFICATION_TYPE.pollCastVoteLimit]: ({ t }) =>
      t(
        'notification.pollVoteLimit',
        'Reached the vote limit. Remove an existing vote first.',
      ),
    [CORE_NOTIFICATION_TYPE.pollCreateFailed]: translatePollCreateFailed,
    // the schedule button is hidden whenever a block applies, so this follows only a race
    [CORE_NOTIFICATION_TYPE.scheduledMessageBlocked]: ({ t }) =>
      t('scheduledMessages.notification.blocked', "This message can't be scheduled"),
    [CORE_NOTIFICATION_TYPE.scheduledMessageCompositionEnded]:
      translateScheduledMessageCompositionEnded,
    [CORE_NOTIFICATION_TYPE.scheduledMessageCreateFailed]:
      translateScheduledMessageRequestFailed,
    [CORE_NOTIFICATION_TYPE.scheduledMessageUpdateFailed]:
      translateScheduledMessageRequestFailed,
  };

/**
 * Translators for notifications this SDK emits itself, which core does not know. There is no union
 * to check them against, so list only identifiers this SDK actually emits.
 */
const sdkNotificationTranslators: Record<string, NotificationTranslator> = {
  'api:location:share:failed': ({ t }) =>
    t('notification.locationShareFailed', 'Failed to share location'),
  'api:poll:end:failed': translatePollEndFailed,
  'api:poll:end:success': ({ t }) => t('notification.pollEndSuccess', 'Poll Ended'),
  'browser:audio:playback:error': translateBrowserAudioPlaybackError,
  'browser:location:get:failed': ({ t }) =>
    t('notification.locationGetFailed', 'Failed to retrieve location'),
};

export const translatorsByNotificationType: Record<string, NotificationTranslator> = {
  ...coreNotificationTranslators,
  ...sdkNotificationTranslators,
};

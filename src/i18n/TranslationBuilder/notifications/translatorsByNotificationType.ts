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
} from './translators';
import type { Translator } from '../../index';

type NotificationTranslator = Translator<NotificationTranslatorOptions>;

/**
 * A translator for every notification `stream-chat` itself emits.
 *
 * `Record<CoreNotificationType, …>` is the point: a new identifier in core fails to compile here until
 * it is mapped, and an entry for one that no longer exists is rejected. Before core exported the union,
 * this table and the React Native SDK's equivalent were hand-maintained copies of each other, and both
 * had drifted — carrying entries nothing emits while missing identifiers that fell through to
 * untranslated English.
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
    // Previously unmapped, so these rendered untranslated English from `notification.message`.
    [CORE_NOTIFICATION_TYPE.messageJumpFailed]: ({ t }) =>
      t('notification.messageJumpFailed', 'Failed to jump to the message'),
    [CORE_NOTIFICATION_TYPE.messageJumpToLatestFailed]: ({ t }) =>
      t('notification.messageJumpToLatestFailed', 'Failed to jump to the latest message'),
    [CORE_NOTIFICATION_TYPE.pollCastVoteLimit]: ({ t }) =>
      t(
        'notification.pollVoteLimit',
        'Reached the vote limit. Remove an existing vote first.',
      ),
    [CORE_NOTIFICATION_TYPE.pollCreateFailed]: translatePollCreateFailed,
  };

/**
 * Translators for notifications this SDK emits itself, which core knows nothing about.
 *
 * Deliberately not exhaustiveness-checked — there is no union to check against — so keep it to
 * identifiers that are actually emitted. `api:reply:search:failed` and
 * `channel:jumpToFirstUnread:failed` were removed here: both were copied between the two UI SDKs and
 * neither is emitted by this one.
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

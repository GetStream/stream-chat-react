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

export const translatorsByNotificationType: Record<
  string,
  Translator<NotificationTranslatorOptions>
> = {
  'api:attachment:upload:failed': translateAttachmentUploadFailed,
  'api:location:create:failed': ({ t }) =>
    t('notification.locationShareFailed', 'Failed to share location'),
  'api:location:share:failed': ({ t }) =>
    t('notification.locationShareFailed', 'Failed to share location'),
  'api:poll:create:failed': translatePollCreateFailed,
  'api:poll:end:failed': translatePollEndFailed,
  'api:poll:end:success': ({ t }) => t('notification.pollEndSuccess', 'Poll Ended'),
  'api:reply:search:failed': ({ t }) =>
    t('notification.replySearchFailed', 'Thread has not been found'),
  'browser:audio:playback:error': translateBrowserAudioPlaybackError,
  'browser:location:get:failed': ({ t }) =>
    t('notification.locationGetFailed', 'Failed to retrieve location'),
  'channel:jumpToFirstUnread:failed': ({ t }) =>
    t(
      'notification.jumpToFirstUnreadFailed',
      'Failed to jump to the first unread message',
    ),
  'validation:attachment:file:missing': ({ t }) =>
    t('notification.attachmentFileMissing', 'File is required for upload attachment'),
  'validation:attachment:id:missing': ({ t }) =>
    t('notification.attachmentIdMissing', 'Local upload attachment missing local id'),
  'validation:attachment:upload:blocked': translateAttachmentUploadBlocked,
  'validation:attachment:upload:in-progress': ({ t }) =>
    t(
      'notification.attachmentUploadInProgress',
      'Wait until all attachments have uploaded',
    ),
  'validation:command:disabled': translateCommandDisabled,
  'validation:poll:castVote:limit': ({ t }) =>
    t(
      'notification.pollVoteLimit',
      'Reached the vote limit. Remove an existing vote first.',
    ),
};

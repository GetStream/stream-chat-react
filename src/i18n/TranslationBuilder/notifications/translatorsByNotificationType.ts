import type { NotificationTranslatorOptions } from './types';
import {
  translateAttachmentUploadBlocked,
  translateAttachmentUploadFailed,
  translateBrowserAudioPlaybackError,
  translatePollCreateFailed,
  translatePollEndFailed,
} from './translators';
import type { Translator } from '../../index';

export const translatorsByNotificationType: Record<
  string,
  Translator<NotificationTranslatorOptions>
> = {
  'api:attachment:upload:failed': translateAttachmentUploadFailed,
  'api:location:create:failed': ({ t }) => t('Failed to share location'),
  'api:location:share:failed': ({ t }) => t('Failed to share location'),
  'api:poll:create:failed': translatePollCreateFailed,
  'api:poll:end:failed': translatePollEndFailed,
  'api:poll:end:success': ({ t }) => t('Poll ended'),
  'api:reply:search:failed': ({ t }) => t('Thread has not been found'),
  'browser:audio:playback:error': translateBrowserAudioPlaybackError,
  'browser:location:get:failed': ({ t }) => t('Failed to retrieve location'),
  'channel:jumpToFirstUnread:failed': ({ t }) =>
    t('Failed to jump to the first unread message'),
  'validation:attachment:file:missing': ({ t }) =>
    t('File is required for upload attachment'),
  'validation:attachment:id:missing': ({ t }) =>
    t('Local upload attachment missing local id'),
  'validation:attachment:upload:blocked': translateAttachmentUploadBlocked,
  'validation:attachment:upload:in-progress': ({ t }) =>
    t('Wait until all attachments have uploaded'),
  'validation:poll:castVote:limit': ({ t }) =>
    t('Reached the vote limit. Remove an existing vote first.'),
};

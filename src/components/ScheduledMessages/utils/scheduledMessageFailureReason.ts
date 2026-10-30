import type { TFunction } from 'i18next';
import { ScheduledMessageFailureReason } from 'stream-chat';

export const translateScheduledMessageFailureReason = (
  t: TFunction,
  failureReason?: ScheduledMessageFailureReason,
) => {
  switch (failureReason) {
    case ScheduledMessageFailureReason.Banned:
      return t("You can't send messages in this channel");
    case ScheduledMessageFailureReason.NoPermission:
      return t("You're no longer allowed to post here");
    case ScheduledMessageFailureReason.ChannelFrozen:
      return t('This channel is frozen');
    case ScheduledMessageFailureReason.ChannelDeleted:
      return t('This channel was deleted');
    case ScheduledMessageFailureReason.UserDeleted:
      return undefined;
    case ScheduledMessageFailureReason.ModerationBlocked:
      return t('Blocked by moderation');
    case ScheduledMessageFailureReason.HookRejected:
      return t('Rejected by the app');
    case ScheduledMessageFailureReason.Expired:
      return t('Not sent: the service was delayed');
    case ScheduledMessageFailureReason.InvalidMessage:
      return t("The message no longer meets the app's limits. Edit it");
    case ScheduledMessageFailureReason.PendingNotSupported:
      return t('This channel now holds messages for approval. Schedule it again');
    default:
      return t('Something went wrong. Try again');
  }
};

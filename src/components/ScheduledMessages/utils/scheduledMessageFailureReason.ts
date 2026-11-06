import type { StreamTFunction } from '../../../i18n/types';
import { SCHEDULED_MESSAGE_FAILURE_REASON } from 'stream-chat';
import type { ScheduledMessageFailureReason } from 'stream-chat';

export const translateScheduledMessageFailureReason = (
  t: StreamTFunction,
  failureReason?: ScheduledMessageFailureReason,
) => {
  switch (failureReason) {
    case SCHEDULED_MESSAGE_FAILURE_REASON.Banned:
      return t(
        'scheduledMessages.youCantSendMessagesInThisChannel',
        "You can't send messages in this channel",
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.NoPermission:
      return t(
        'scheduledMessages.youreNoLongerAllowedToPostHere',
        "You're no longer allowed to post here",
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen:
      return t('scheduledMessages.thisChannelIsFrozen', 'This channel is frozen');
    case SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted:
      return t('scheduledMessages.thisChannelWasDeleted', 'This channel was deleted');
    case SCHEDULED_MESSAGE_FAILURE_REASON.UserDeleted:
      return undefined;
    case SCHEDULED_MESSAGE_FAILURE_REASON.ModerationBlocked:
      return t('scheduledMessages.blockedByModeration', 'Blocked by moderation');
    case SCHEDULED_MESSAGE_FAILURE_REASON.HookRejected:
      return t('scheduledMessages.rejectedByTheApp', 'Rejected by the app');
    case SCHEDULED_MESSAGE_FAILURE_REASON.Expired:
      return t(
        'scheduledMessages.notSentTheServiceWasDelayed',
        'Not sent: the service was delayed',
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.InvalidMessage:
      return t(
        'scheduledMessages.theMessageNoLongerMeetsTheAppsLimits',
        "The message no longer meets the app's limits. Edit it",
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.PendingNotSupported:
      return t(
        'scheduledMessages.thisChannelNowHoldsMessagesForApprovalSchedule',
        'This channel now holds messages for approval. Schedule it again',
      );
    default:
      return t('scheduledMessages.couldntSendTryAgain', "Couldn't send. Try again");
  }
};

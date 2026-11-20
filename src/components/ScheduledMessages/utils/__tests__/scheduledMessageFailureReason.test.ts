import { SCHEDULED_MESSAGE_FAILURE_REASON } from 'stream-chat';

import { translateScheduledMessageFailureReason } from '../scheduledMessageFailureReason';
import { mockT } from '../../../../mock-builders';
import type { StreamTFunction } from '../../../../i18n/types';

const t = mockT as StreamTFunction;

describe('translateScheduledMessageFailureReason', () => {
  it.each([
    [SCHEDULED_MESSAGE_FAILURE_REASON.Banned, "You can't send messages in this channel"],
    [
      SCHEDULED_MESSAGE_FAILURE_REASON.NoPermission,
      "You're no longer allowed to post here",
    ],
    [SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen, 'This channel is frozen'],
    [SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted, 'This channel was deleted'],
    [SCHEDULED_MESSAGE_FAILURE_REASON.ModerationBlocked, 'Blocked by moderation'],
    [SCHEDULED_MESSAGE_FAILURE_REASON.HookRejected, 'Rejected by the app'],
    [SCHEDULED_MESSAGE_FAILURE_REASON.Expired, 'Not sent: the service was delayed'],
    [
      SCHEDULED_MESSAGE_FAILURE_REASON.InvalidMessage,
      "The message no longer meets the app's limits. Edit it",
    ],
    [
      SCHEDULED_MESSAGE_FAILURE_REASON.PendingNotSupported,
      'This channel now holds messages for approval. Schedule it again',
    ],
    [SCHEDULED_MESSAGE_FAILURE_REASON.InternalError, "Couldn't send. Try again"],
  ])('translates %s', (failureReason, expected) => {
    expect(translateScheduledMessageFailureReason(t, failureReason)).toBe(expected);
  });

  it('shows no copy when the user was deleted', () => {
    expect(
      translateScheduledMessageFailureReason(
        t,
        SCHEDULED_MESSAGE_FAILURE_REASON.UserDeleted,
      ),
    ).toBeUndefined();
  });

  it('falls back to the generic copy without a reason', () => {
    expect(translateScheduledMessageFailureReason(t)).toBe("Couldn't send. Try again");
  });
});

import type { TFunction } from 'i18next';
import { ScheduledMessageFailureReason } from 'stream-chat';

import { translateScheduledMessageFailureReason } from '../scheduledMessageFailureReason';

const t = ((key: string) => key) as TFunction;

describe('translateScheduledMessageFailureReason', () => {
  it.each([
    [ScheduledMessageFailureReason.Banned, "You can't send messages in this channel"],
    [ScheduledMessageFailureReason.NoPermission, "You're no longer allowed to post here"],
    [ScheduledMessageFailureReason.ChannelFrozen, 'This channel is frozen'],
    [ScheduledMessageFailureReason.ChannelDeleted, 'This channel was deleted'],
    [ScheduledMessageFailureReason.ModerationBlocked, 'Blocked by moderation'],
    [ScheduledMessageFailureReason.HookRejected, 'Rejected by the app'],
    [ScheduledMessageFailureReason.Expired, 'Not sent: the service was delayed'],
    [
      ScheduledMessageFailureReason.InvalidMessage,
      "The message no longer meets the app's limits. Edit it",
    ],
    [
      ScheduledMessageFailureReason.PendingNotSupported,
      'This channel now holds messages for approval. Schedule it again',
    ],
    [ScheduledMessageFailureReason.InternalError, 'Something went wrong. Try again'],
  ])('translates %s', (failureReason, expected) => {
    expect(translateScheduledMessageFailureReason(t, failureReason)).toBe(expected);
  });

  it('shows no copy when the user was deleted', () => {
    expect(
      translateScheduledMessageFailureReason(
        t,
        ScheduledMessageFailureReason.UserDeleted,
      ),
    ).toBeUndefined();
  });

  it('falls back to the generic copy without a reason', () => {
    expect(translateScheduledMessageFailureReason(t)).toBe(
      'Something went wrong. Try again',
    );
  });
});

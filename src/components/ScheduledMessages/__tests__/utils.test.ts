import { SCHEDULED_MESSAGE_FAILURE_REASON } from 'stream-chat';
import type { Channel } from 'stream-chat';

import { convertDateToTimestamp, generateScheduledMessage } from '../../../mock-builders';
import {
  formatTimeZoneOffset,
  fromInputValues,
  getDefaultScheduledAt,
  getScheduledMessageActions,
  getSchedulePresets,
  getScheduleTimeBounds,
  getScheduleTimeError,
  groupScheduledMessages,
  searchScheduledMessages,
  translateScheduledMessageFailureReason,
} from '../utils';

const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 0);
const scheduledAt = (day: number, hour: number) => ({
  scheduled_at: convertDateToTimestamp(at(day, hour)),
});
const withLimits = (minLeadTimeSeconds: number, maxLeadTimeSeconds: number) =>
  ({
    serverConfig: {
      scheduled_messages_max_lead_time_seconds: maxLeadTimeSeconds,
      scheduled_messages_max_per_channel: 10,
      scheduled_messages_max_per_user: 100,
      scheduled_messages_min_lead_time_seconds: minLeadTimeSeconds,
    },
  }) as unknown as Channel;

describe('scheduled message utils', () => {
  it('groups pending messages by day and puts the failed ones first', () => {
    const morning = generateScheduledMessage(scheduledAt(29, 9));
    const evening = generateScheduledMessage(scheduledAt(29, 18));
    const nextDay = generateScheduledMessage(scheduledAt(30, 9));
    const failed = generateScheduledMessage({ ...scheduledAt(28, 9), status: 'failed' });

    const groups = groupScheduledMessages([morning, evening, nextDay, failed]);

    expect(groups.map(({ key }) => key)).toEqual(['failed', '2026-10-29', '2026-10-30']);
    expect(groups[0].day).toBeUndefined();
    expect(groups[1].scheduledMessages).toEqual([morning, evening]);
  });

  it('searches the text case-insensitively and ignores a blank query', () => {
    const lunch = generateScheduledMessage({
      message: { custom: {}, text: 'Lunch at noon' },
    });
    const launch = generateScheduledMessage({ message: { custom: {}, text: 'Launch' } });

    expect(searchScheduledMessages([lunch, launch], ' LUNCH ')).toEqual([lunch]);
    expect(searchScheduledMessages([lunch, launch], '  ')).toEqual([lunch, launch]);
  });

  describe('time bounds', () => {
    it('starts a minute after the minimum lead time and ends at the maximum', () => {
      const now = at(28, 10);

      const { earliest, latest } = getScheduleTimeBounds(withLimits(60, 3600), now);

      expect(earliest).toEqual(new Date(now.getTime() + 2 * 60 * 1000));
      expect(latest).toEqual(new Date(now.getTime() + 3600 * 1000));
    });

    it('leaves the latest time open for a channel without limits', () => {
      expect(getScheduleTimeBounds({} as Channel, at(28, 10)).latest).toBeUndefined();
    });

    it('reports a time outside the bounds', () => {
      const bounds = { earliest: at(28, 10), latest: at(29, 10) };

      expect(getScheduleTimeError(at(28, 9), bounds)).toBe('tooSoon');
      expect(getScheduleTimeError(at(30, 9), bounds)).toBe('tooFar');
      expect(getScheduleTimeError(at(28, 12), bounds)).toBeUndefined();
    });

    it('defaults to the next full hour after the earliest time', () => {
      expect(getDefaultScheduledAt({ earliest: new Date(2026, 9, 28, 10, 25) })).toEqual(
        at(28, 11),
      );
    });
  });

  describe('presets', () => {
    const open = { earliest: new Date(0) };

    it('offers tomorrow morning and afternoon and next Monday morning', () => {
      // a Wednesday
      expect(getSchedulePresets(at(28, 10), open)).toEqual([
        at(29, 9),
        at(29, 13),
        new Date(2026, 10, 2, 9, 0),
      ]);
    });

    it('leaves out next Monday when it is tomorrow', () => {
      // a Sunday
      expect(getSchedulePresets(new Date(2026, 10, 1, 10, 0), open)).toHaveLength(2);
    });

    it('leaves out a preset outside the bounds', () => {
      expect(getSchedulePresets(at(28, 10), { earliest: at(29, 12) })).toEqual([
        at(29, 13),
        new Date(2026, 10, 2, 9, 0),
      ]);
    });
  });

  describe('actions', () => {
    it('offers every action for a pending message, without edit when it cannot open', () => {
      const pending = generateScheduledMessage();

      expect(getScheduledMessageActions(pending, true)).toEqual([
        'edit',
        'reschedule',
        'send_now',
        'delete',
      ]);
      expect(getScheduledMessageActions(pending, false)).not.toContain('edit');
    });

    it('offers nothing while the message is being sent', () => {
      expect(
        getScheduledMessageActions(generateScheduledMessage({ status: 'sending' }), true),
      ).toEqual([]);
    });

    it('offers copy and delete for a message whose channel was deleted', () => {
      const failed = generateScheduledMessage({
        failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted,
        status: 'failed',
      });

      expect(getScheduledMessageActions(failed, true)).toEqual(['copy', 'delete']);
    });
  });

  it('explains a failure, except when the user was deleted', () => {
    const t = ((_key: string, defaultValue: string) => defaultValue) as never;

    expect(
      translateScheduledMessageFailureReason(
        t,
        SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen,
      ),
    ).toBe('This channel is frozen');
    expect(
      translateScheduledMessageFailureReason(
        t,
        SCHEDULED_MESSAGE_FAILURE_REASON.UserDeleted,
      ),
    ).toBeUndefined();
    expect(translateScheduledMessageFailureReason(t)).toBe("Couldn't send. Try again");
    expect(
      translateScheduledMessageFailureReason(
        t,
        SCHEDULED_MESSAGE_FAILURE_REASON.InternalError,
      ),
    ).toBe('Something went wrong. Try again');
    expect(
      translateScheduledMessageFailureReason(
        t,
        SCHEDULED_MESSAGE_FAILURE_REASON.PendingNotSupported,
      ),
    ).toBe('This channel now needs approval. Schedule it again');
  });

  it('reads the date and time inputs, rejecting an invalid value', () => {
    expect(fromInputValues('2026-10-28', '14:30')).toEqual(new Date(2026, 9, 28, 14, 30));
    expect(fromInputValues('2026-10-28')).toEqual(at(28, 0));
    expect(fromInputValues('', '14:30')).toBeUndefined();
    expect(fromInputValues('not-a-date', '14:30')).toBeUndefined();
  });

  it('formats the time zone offset', () => {
    const date = new Date();
    vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(-330);

    expect(formatTimeZoneOffset(date)).toBe('GMT+5:30');
  });
});

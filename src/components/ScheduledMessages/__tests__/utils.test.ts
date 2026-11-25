import { ScheduledMessageErrorReason } from 'stream-chat';
import type { Channel, MessageComposer } from 'stream-chat';

import { generateScheduledMessage, getTestClientWithUser } from '../../../mock-builders';
import {
  formatTimeZoneOffset,
  fromInputValues,
  getChannelByCid,
  getDefaultScheduledAt,
  getScheduleDialogId,
  getSchedulePresets,
  getScheduleTimeBounds,
  getScheduleTimeError,
  toRescheduledMessageRequest,
} from '../utils';

const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 0);
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
  it("returns the client's channel instance for a cid", async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const channel = client.channel('messaging', 'general');

    expect(getChannelByCid(client, 'messaging:general')).toBe(channel);
  });

  it('takes the content of a failed message to schedule it again, without its id', () => {
    const failed = generateScheduledMessage({
      message: {
        custom: { priority: 'high' },
        html: '<p>Launch moved to Monday</p>',
        mentioned_users: ['user-2'],
        parent_id: 'parent-id',
        quoted_message_id: 'quoted-id',
        show_in_channel: true,
        text: 'Launch moved to Monday',
      },
      status: 'failed',
    });

    expect(toRescheduledMessageRequest(failed)).toEqual(
      expect.objectContaining({
        custom: { priority: 'high' },
        mentioned_users: ['user-2'],
        parent_id: 'parent-id',
        quoted_message_id: 'quoted-id',
        show_in_channel: true,
        text: 'Launch moved to Monday',
      }),
    );
    expect(toRescheduledMessageRequest(failed)).not.toHaveProperty('id');
    expect(toRescheduledMessageRequest(failed)).not.toHaveProperty('html');
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

      expect(getScheduleTimeError(at(28, 9), bounds)).toBe(
        ScheduledMessageErrorReason.TooSoon,
      );
      expect(getScheduleTimeError(at(30, 9), bounds)).toBe(
        ScheduledMessageErrorReason.TooFar,
      );
      expect(getScheduleTimeError(at(28, 12), bounds)).toBeUndefined();
    });

    it('defaults to the next full hour after the earliest time', () => {
      expect(getDefaultScheduledAt({ earliest: new Date(2026, 9, 28, 10, 25) })).toEqual(
        at(28, 11),
      );
    });

    it('picks the first whole minute allowed when the next full hour is too late', () => {
      expect(
        getDefaultScheduledAt({
          earliest: new Date(2026, 9, 28, 10, 25, 30),
          latest: new Date(2026, 9, 28, 10, 50),
        }),
      ).toEqual(new Date(2026, 9, 28, 10, 26));
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

  it('reads the date and time inputs, rejecting an invalid value', () => {
    expect(fromInputValues('2026-10-28', '14:30')).toEqual(new Date(2026, 9, 28, 14, 30));
    expect(fromInputValues('2026-10-28')).toEqual(at(28, 0));
    expect(fromInputValues('', '14:30')).toBeUndefined();
    expect(fromInputValues('not-a-date', '14:30')).toBeUndefined();
  });

  it('formats the time zone offset', () => {
    expect(formatTimeZoneOffset(new Date(2026, 9, 28, 10, 0))).toMatch(/^GMT(\+0)?$/);
  });

  it('names the time dialog after the composer channel and thread', () => {
    const channel = { cid: 'messaging:general' } as Channel;
    const channelComposer = { channel, threadId: null } as MessageComposer;
    const threadComposer = { channel, threadId: 'parent-id' } as MessageComposer;

    expect(getScheduleDialogId(channelComposer)).toBe(
      'schedule-message-dialog-messaging:general',
    );
    expect(getScheduleDialogId(threadComposer)).toBe(
      'schedule-message-dialog-messaging:general-parent-id',
    );
  });
});

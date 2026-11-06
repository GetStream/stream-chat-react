import { nsToDate, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';
import type { ScheduledMessageStatus, TimestampNS } from 'stream-chat';

import { ScheduledMessageGroupType } from '../../constants';
import {
  groupScheduledMessages,
  isFailedScheduledMessage,
} from '../scheduledMessageGroups';
import {
  convertDateToTimestamp,
  generateScheduledMessage,
} from '../../../../mock-builders';

const atLocalTime = (day: number, hour: number) =>
  convertDateToTimestamp(new Date(2026, 9, day, hour, 0));

const scheduledFor = (
  id: string,
  scheduledAt: TimestampNS,
  status: ScheduledMessageStatus = SCHEDULED_MESSAGE_STATUS.Scheduled,
) => generateScheduledMessage({ id, scheduled_at: scheduledAt, status });

describe('isFailedScheduledMessage', () => {
  it.each([
    [SCHEDULED_MESSAGE_STATUS.Failed, true],
    [SCHEDULED_MESSAGE_STATUS.Scheduled, false],
    [SCHEDULED_MESSAGE_STATUS.Sending, false],
  ])('treats the %s status as failed: %s', (status, expected) => {
    expect(isFailedScheduledMessage(scheduledFor('id', atLocalTime(29, 9), status))).toBe(
      expected,
    );
  });
});

describe('groupScheduledMessages', () => {
  it('returns no groups for an empty list', () => {
    expect(groupScheduledMessages([])).toEqual([]);
  });

  it('puts failed messages in one group before the upcoming days', () => {
    const failed = scheduledFor(
      'failed',
      atLocalTime(30, 9),
      SCHEDULED_MESSAGE_STATUS.Failed,
    );
    const upcoming = scheduledFor('upcoming', atLocalTime(29, 9));

    const groups = groupScheduledMessages([upcoming, failed]);

    expect(groups.map(({ id, type }) => [id, type])).toEqual([
      ['failed', ScheduledMessageGroupType.Failed],
      ['2026-10-29', ScheduledMessageGroupType.Day],
    ]);
    expect(groups[0].scheduledMessages).toEqual([failed]);
    expect(groups[0].day).toBeUndefined();
  });

  it('groups upcoming messages by local day and keeps their order', () => {
    const morning = scheduledFor('morning', atLocalTime(29, 9));
    const afternoon = scheduledFor('afternoon', atLocalTime(29, 13));
    const nextDay = scheduledFor('next-day', atLocalTime(30, 9));

    const groups = groupScheduledMessages([morning, afternoon, nextDay]);

    expect(groups.map(({ id }) => id)).toEqual(['2026-10-29', '2026-10-30']);
    expect(groups[0].scheduledMessages).toEqual([morning, afternoon]);
    expect(groups[1].scheduledMessages).toEqual([nextDay]);
    expect(groups[0].day).toEqual(nsToDate(morning.scheduled_at));
  });

  it('keeps sending messages in their day group', () => {
    const sending = scheduledFor(
      'sending',
      atLocalTime(29, 9),
      SCHEDULED_MESSAGE_STATUS.Sending,
    );

    const [group] = groupScheduledMessages([sending]);

    expect(group.type).toBe(ScheduledMessageGroupType.Day);
    expect(group.scheduledMessages).toEqual([sending]);
  });

  it('leaves out the failed group when nothing failed', () => {
    const groups = groupScheduledMessages([scheduledFor('upcoming', atLocalTime(29, 9))]);

    expect(groups.map(({ type }) => type)).toEqual([ScheduledMessageGroupType.Day]);
  });
});

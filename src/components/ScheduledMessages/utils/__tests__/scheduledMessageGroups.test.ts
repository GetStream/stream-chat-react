import { ScheduledMessageStatus } from 'stream-chat';

import { ScheduledMessageGroupType } from '../../constants';
import {
  groupScheduledMessages,
  isFailedScheduledMessage,
} from '../scheduledMessageGroups';
import { generateScheduledMessage } from '../../../../mock-builders';

const atLocalTime = (day: number, hour: number) =>
  new Date(2026, 9, day, hour, 0).toISOString();

const scheduledFor = (
  id: string,
  scheduledAt: string,
  status: ScheduledMessageStatus = ScheduledMessageStatus.Scheduled,
) => generateScheduledMessage({ id, scheduled_at: scheduledAt, status });

describe('isFailedScheduledMessage', () => {
  it.each([
    [ScheduledMessageStatus.Failed, true],
    [ScheduledMessageStatus.Scheduled, false],
    [ScheduledMessageStatus.Sending, false],
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
      ScheduledMessageStatus.Failed,
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
    expect(groups[0].day).toEqual(new Date(morning.scheduled_at));
  });

  it('keeps sending messages in their day group', () => {
    const sending = scheduledFor(
      'sending',
      atLocalTime(29, 9),
      ScheduledMessageStatus.Sending,
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

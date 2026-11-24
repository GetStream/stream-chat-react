import React from 'react';
import { asTimestampNS, Reminder } from 'stream-chat';
import { act, render, type RenderResult } from '@testing-library/react';
import { Chat } from '../../Chat';
import { ReminderNotification } from '../ReminderNotification';
import { generateUser, getTestClientWithUser } from '../../../mock-builders';
import { generateReminderResponse } from '../../../mock-builders/generator/reminder';

const user = generateUser();
const renderComponent = async ({ reminder }) => {
  const client = await getTestClientWithUser(user);
  let result: RenderResult;
  await act(() => {
    result = render(
      <Chat client={client}>
        <ReminderNotification reminder={reminder} />
      </Chat>,
    );
  });
  return result;
};

describe('ReminderNotification', () => {
  it('displays text for bookmark notifications (saved for later)', async () => {
    const reminder = new Reminder({ data: generateReminderResponse() });
    const { container } = await renderComponent({ reminder });
    expect(container).toMatchSnapshot();
  });
  it('displays text for time due in case of timed reminders (remind me)', async () => {
    const reminder = new Reminder({
      data: generateReminderResponse({
        scheduleOffsetMs: 60 * 1000,
      }),
    });
    const { container } = await renderComponent({ reminder });
    expect(container).toMatchSnapshot();
  });
  it('displays "Due since" with the deadline date for a long-overdue reminder', async () => {
    // `remind_at` is unix nanoseconds, so the epoch is `0`: a `Date` here would type-check through
    // the raw `data` override and exercise a path the wire never produces. `0` is falsy, so a
    // truthiness guard would render "Saved for later" for what is a long-overdue reminder.
    const reminder = new Reminder({
      data: generateReminderResponse({
        data: { remind_at: asTimestampNS(0) },
      }),
    });
    const { container } = await renderComponent({ reminder });
    expect(container).toMatchSnapshot();
  });

  describe('deadline wording', () => {
    const MINUTE_MS = 60 * 1000;
    const DAY_MS = 24 * 60 * MINUTE_MS;
    const getTimeLeftText = (container: HTMLElement) =>
      container.querySelector('.str-chat__message-reminder__time-left')?.textContent;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-11-17T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      ['less than an hour away', 'Due in 30 minutes', 30 * MINUTE_MS],
      ['more than an hour away', 'Tomorrow at 10:00', DAY_MS],
      ['less than an hour overdue', 'Due since 5 minutes ago', -5 * MINUTE_MS],
      ['more than an hour overdue', 'Due since Yesterday at 10:00', -DAY_MS],
      ['more than two weeks overdue', 'Due since Tue, 27 Oct at 10:00', -21 * DAY_MS],
    ])('a deadline %s reads "%s"', async (_case, expectedText, scheduleOffsetMs) => {
      const reminder = new Reminder({
        data: generateReminderResponse({ scheduleOffsetMs }),
      });
      const { container } = await renderComponent({ reminder });
      expect(getTimeLeftText(container)).toBe(expectedText);
    });
  });
});

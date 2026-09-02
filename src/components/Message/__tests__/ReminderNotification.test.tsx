import React from 'react';
import { Reminder } from 'stream-chat';
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
  it('displays text for reminder deadline if trespassed the refresh boundary', async () => {
    // `remind_at` is unix nanoseconds, so the epoch is `0` — a `Date` here would type-check through
    // the raw `data` override and exercise a path the wire never produces. `0` is falsy, so a
    // truthiness guard renders "Saved for later" for what is really a long-overdue reminder.
    const reminder = new Reminder({
      data: generateReminderResponse({
        data: { remind_at: 0 },
      }),
    });
    const { container } = await renderComponent({ reminder });
    expect(container).toMatchSnapshot();
  });
});

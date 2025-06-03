import React from 'react';
import { act, render } from '@testing-library/react';
import { Chat } from '../../Chat';
import { ReminderNotification } from '../ReminderNotification';
import { generateUser, getTestClientWithUser } from '../../../mock-builders';
import { generateReminderResponse } from '../../../mock-builders/generator/reminder';

const user = generateUser();
const renderComponent = async ({ client, reminder }) => {
  let result;
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
  it('displays text for bookmark notifications', async () => {
    const client = await getTestClientWithUser(user);
    const reminderResponse = generateReminderResponse();
    client.reminders.upsertToState({
      data: reminderResponse,
    });
    const reminder = client.reminders.getFromState(reminderResponse.message_id);
    const { container } = await renderComponent({ client, reminder });
    expect(container).toMatchSnapshot();
  });
  it('displays text for bookmark notifications and time due in case of timed reminders', async () => {
    const client = await getTestClientWithUser(user);
    const reminderResponse = generateReminderResponse({
      scheduleOffsetMs: 60 * 1000,
    });
    client.reminders.upsertToState({
      data: reminderResponse,
    });
    const reminder = client.reminders.getFromState(reminderResponse.message_id);
    const { container } = await renderComponent({ client, reminder });
    expect(container).toMatchSnapshot();
  });
  it('displays text for bookmark notifications and reminder deadline if trespassed the refresh boundary', async () => {
    const client = await getTestClientWithUser(user);
    const reminderResponse = generateReminderResponse({
      data: { remind_at: new Date(0).toISOString() },
    });
    client.reminders.upsertToState({
      data: reminderResponse,
    });
    const reminder = client.reminders.getFromState(reminderResponse.message_id);
    const { container } = await renderComponent({ client, reminder });
    expect(container).toMatchSnapshot();
  });
});

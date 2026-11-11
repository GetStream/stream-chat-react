import '../../..';
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { MessageComposer } from '../../MessageComposer';
import {
  generateScheduledMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';

const user = generateUser({ id: 'user-id' });

const renderComposer = async () => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [
      {
        channel: {
          id: 'general',
          own_capabilities: ['send-message', 'schedule-message'],
          type: 'messaging',
        },
      },
    ],
    customUser: user,
  });

  await act(() => {
    render(
      <Chat client={client}>
        <Channel channel={channel}>
          <MessageComposer />
        </Channel>
      </Chat>,
    );
  });

  const scheduledMessage = generateScheduledMessage({
    cid: channel.cid,
    message: { custom: {}, text: 'Launch moved to Monday' },
  });
  const { messageComposer } = channel;

  const failedMessage = generateScheduledMessage({
    cid: channel.cid,
    failure_reason: 'channel_frozen',
    message: { custom: {}, text: 'Launch moved to Monday' },
    status: 'failed',
  });

  const startEditing = () =>
    act(() => messageComposer.editScheduledMessage(scheduledMessage));

  const startSchedulingAgain = () =>
    act(() => messageComposer.editScheduledMessage(failedMessage));

  return {
    channel,
    client,
    failedMessage,
    messageComposer,
    scheduledMessage,
    startEditing,
    startSchedulingAgain,
  };
};

describe('editing a scheduled message in the composer', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the scheduled edit preview and hides the schedule button', async () => {
    const { startEditing } = await renderComposer();

    await startEditing();

    expect(screen.getByText('Edit scheduled message')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-message-button')).not.toBeInTheDocument();
  });

  it('saves the edit with updateScheduledMessage instead of sending', async () => {
    const { channel, messageComposer, scheduledMessage, startEditing } =
      await renderComposer();
    const updateScheduledMessage = vi
      .spyOn(messageComposer, 'updateScheduledMessage')
      .mockResolvedValue({ scheduledMessage, status: 'scheduled' });
    const sendMessage = vi.spyOn(channel, 'sendMessage');

    await startEditing();
    await act(() => fireEvent.click(screen.getByTestId('send-button')));

    expect(updateScheduledMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('restores the earlier draft when the edit is cancelled', async () => {
    const { messageComposer, startEditing } = await renderComposer();
    await act(() => messageComposer.textComposer.setText('my unsent draft'));

    await startEditing();
    await act(() =>
      fireEvent.click(screen.getByRole('button', { name: /cancel|remove/i })),
    );

    expect(screen.queryByText('Edit scheduled message')).not.toBeInTheDocument();
    expect(messageComposer.textComposer.text).toBe('my unsent draft');
  });

  describe('scheduling a failed message again', () => {
    it('shows the schedule-again preview and keeps the schedule button', async () => {
      const { startSchedulingAgain } = await renderComposer();

      await startSchedulingAgain();

      expect(screen.getByText('Schedule again')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-message-button')).toBeInTheDocument();
    });

    it('restores the earlier draft when cancelled', async () => {
      const { messageComposer, startSchedulingAgain } = await renderComposer();
      await act(() => messageComposer.textComposer.setText('my unsent draft'));

      await startSchedulingAgain();
      await act(() =>
        fireEvent.click(screen.getByRole('button', { name: /cancel|remove/i })),
      );

      expect(screen.queryByText('Schedule again')).not.toBeInTheDocument();
      expect(messageComposer.textComposer.text).toBe('my unsent draft');
    });

    it('deletes the failed message after sending it now', async () => {
      const { channel, failedMessage, startSchedulingAgain } = await renderComposer();
      vi.spyOn(channel, 'sendMessage').mockResolvedValue(
        fromPartial({ message: { id: 'sent-id', text: 'Launch moved to Monday' } }),
      );
      const deleteScheduledMessage = vi
        .spyOn(channel, 'deleteScheduledMessage')
        .mockResolvedValue(failedMessage);

      await startSchedulingAgain();
      await act(() => fireEvent.click(screen.getByTestId('send-button')));

      expect(deleteScheduledMessage).toHaveBeenCalledWith(failedMessage.id);
    });
  });
});

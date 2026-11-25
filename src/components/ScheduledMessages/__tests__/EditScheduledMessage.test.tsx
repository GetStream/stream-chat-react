import '../../..';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { MessageComposer } from '../../MessageComposer';
import {
  convertDateToTimestamp,
  generateMessage,
  generateScheduledMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';

const user = generateUser({ id: 'user-id' });
const WEDNESDAY_MORNING = new Date(2026, 9, 28, 10, 30);
const SEND_TIME = new Date(2026, 9, 29, 9, 0);

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
    scheduled_at: convertDateToTimestamp(SEND_TIME),
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
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
    vi.setSystemTime(WEDNESDAY_MORNING);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('previews the message being edited and hides the schedule button', async () => {
    const { startEditing } = await renderComposer();

    await startEditing();

    const editPreview = screen.getByTestId('quoted-message-preview');
    expect(editPreview).toHaveTextContent('Edit scheduled message');
    expect(editPreview).toHaveTextContent('Launch moved to Monday');
    expect(screen.queryByTestId('schedule-message-button')).not.toBeInTheDocument();
  });

  it('shows the quoted message below the edit preview, and lets it be removed', async () => {
    const { channel, client, messageComposer } = await renderComposer();
    const quotedMessage = generateMessage({ text: 'Venue options for Saturday', user });
    client.messageStore.upsert(quotedMessage);
    const quotingMessage = generateScheduledMessage({
      cid: channel.cid,
      message: { custom: {}, quoted_message_id: quotedMessage.id, text: 'Booked it' },
      scheduled_at: convertDateToTimestamp(SEND_TIME),
    });

    await act(() => messageComposer.editScheduledMessage(quotingMessage));

    const [editPreview, quotePreview] = screen.getAllByTestId('quoted-message-preview');
    expect(editPreview).toHaveTextContent('Edit scheduled message');
    expect(quotePreview).toHaveTextContent('Venue options for Saturday');

    await act(() =>
      fireEvent.click(
        within(quotePreview).getByTestId('quoted-message-preview-dismiss-btn'),
      ),
    );

    expect(screen.getAllByTestId('quoted-message-preview')).toHaveLength(1);
    expect(messageComposer.quotedMessage).toBeNull();
    expect(screen.getByText('Edit scheduled message')).toBeInTheDocument();
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

  it('clears the composer when the edit is cancelled', async () => {
    const { messageComposer, startEditing } = await renderComposer();
    await act(() => messageComposer.textComposer.setText('my unsent draft'));

    await startEditing();
    await act(() =>
      fireEvent.click(screen.getByTestId('quoted-message-preview-dismiss-btn')),
    );

    expect(screen.queryByText('Edit scheduled message')).not.toBeInTheDocument();
    expect(messageComposer.textComposer.text).toBe('');
  });

  describe('scheduling a failed message again', () => {
    it('shows the schedule-again preview and keeps the schedule button', async () => {
      const { startSchedulingAgain } = await renderComposer();

      await startSchedulingAgain();

      expect(screen.getByText('Schedule again')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-message-button')).toBeInTheDocument();
    });

    it('clears the composer when cancelled', async () => {
      const { messageComposer, startSchedulingAgain } = await renderComposer();
      await act(() => messageComposer.textComposer.setText('my unsent draft'));

      await startSchedulingAgain();
      await act(() =>
        fireEvent.click(screen.getByRole('button', { name: /cancel|remove/i })),
      );

      expect(screen.queryByText('Schedule again')).not.toBeInTheDocument();
      expect(messageComposer.textComposer.text).toBe('');
    });

    it('deletes the failed message after sending it now', async () => {
      const { channel, failedMessage, startSchedulingAgain } = await renderComposer();
      vi.spyOn(channel, 'sendMessage').mockResolvedValue(
        fromPartial({ message: { id: 'sent-id', text: 'Launch moved to Monday' } }),
      );
      const deleteScheduledMessage = vi
        .spyOn(channel.messageOperations, 'deleteScheduledMessage')
        .mockResolvedValue(failedMessage);

      await startSchedulingAgain();
      await act(() => fireEvent.click(screen.getByTestId('send-button')));

      expect(deleteScheduledMessage).toHaveBeenCalledWith(failedMessage.id);
    });
  });
});

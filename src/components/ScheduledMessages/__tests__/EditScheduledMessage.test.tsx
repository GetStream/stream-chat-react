import '../../..';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('shows when the message is sent and hides the schedule button', async () => {
    const { startEditing } = await renderComposer();

    await startEditing();

    expect(screen.getByTestId('scheduled-message-preview')).toHaveTextContent(
      'This message will be sent Thu, Oct 29 at 09:00',
    );
    expect(screen.queryByTestId('schedule-message-button')).not.toBeInTheDocument();
  });

  it('reschedules the message without saving the text being edited', async () => {
    const { channel, messageComposer, scheduledMessage, startEditing } =
      await renderComposer();
    const newSendTime = new Date(2026, 9, 29, 14, 30);
    const updateScheduledMessage = vi
      .spyOn(channel, 'updateScheduledMessage')
      .mockResolvedValue({
        ...scheduledMessage,
        scheduled_at: convertDateToTimestamp(newSendTime),
        updated_at: scheduledMessage.updated_at + 1_000_000,
      });

    await startEditing();
    await act(() => messageComposer.textComposer.setText('Launch moved to Tuesday'));
    await act(() =>
      fireEvent.click(screen.getByTestId('scheduled-message-preview-reschedule-button')),
    );
    const dialog = await screen.findByTestId('schedule-message-dialog');
    expect(dialog).toHaveTextContent('Reschedule message');
    expect(screen.getByLabelText('Time')).toHaveValue('09:00');

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '14:30' } });
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save' })));

    expect(updateScheduledMessage).toHaveBeenCalledWith(scheduledMessage.id, {
      scheduled_at: newSendTime,
    });
    await waitFor(() =>
      expect(screen.queryByTestId('schedule-message-dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('scheduled-message-preview')).toHaveTextContent(
      'This message will be sent Thu, Oct 29 at 14:30',
    );
    expect(messageComposer.editedScheduledMessage?.id).toBe(scheduledMessage.id);
    expect(messageComposer.textComposer.text).toBe('Launch moved to Tuesday');
  });

  it('shows the quoted message below the send time, and lets it be removed', async () => {
    const { channel, client, messageComposer } = await renderComposer();
    const quotedMessage = generateMessage({ text: 'Venue options for Saturday', user });
    client.messageStore.upsert(quotedMessage);
    const quotingMessage = generateScheduledMessage({
      cid: channel.cid,
      message: { custom: {}, quoted_message_id: quotedMessage.id, text: 'Booked it' },
      scheduled_at: convertDateToTimestamp(SEND_TIME),
    });

    await act(() => messageComposer.editScheduledMessage(quotingMessage));

    const sendTimePreview = screen.getByTestId('scheduled-message-preview');
    const quotePreview = screen.getByTestId('quoted-message-preview');
    expect(quotePreview).toHaveTextContent('Venue options for Saturday');
    expect(
      sendTimePreview.compareDocumentPosition(quotePreview) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await act(() =>
      fireEvent.click(screen.getByTestId('quoted-message-preview-dismiss-btn')),
    );

    expect(screen.queryByTestId('quoted-message-preview')).not.toBeInTheDocument();
    expect(messageComposer.quotedMessage).toBeNull();
    expect(screen.getByTestId('scheduled-message-preview')).toBeInTheDocument();
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
      fireEvent.click(screen.getByRole('button', { name: 'Cancel editing' })),
    );

    expect(screen.queryByTestId('scheduled-message-preview')).not.toBeInTheDocument();
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

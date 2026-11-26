import '../../..';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { MessageComposer } from '../../MessageComposer';
import { useMessageComposerSubmitFn } from '../../MessageComposer/hooks/useMessageComposerSubmitFn';
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

let submitWithoutDialog: ReturnType<typeof useMessageComposerSubmitFn> | undefined;

const SubmitFnProbe = () => {
  submitWithoutDialog = useMessageComposerSubmitFn();
  return null;
};

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
          <SubmitFnProbe />
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

  it('labels the preview dismiss button as cancelling the edit', async () => {
    const { startEditing } = await renderComposer();

    await startEditing();

    expect(screen.getByRole('button', { name: 'Cancel edit' })).toBeInTheDocument();
  });

  describe('scheduling a failed message again', () => {
    it('shows the schedule-again preview and a save button instead of the schedule button', async () => {
      const { startSchedulingAgain } = await renderComposer();

      await startSchedulingAgain();

      expect(screen.getByText('Schedule again')).toBeInTheDocument();
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
      expect(screen.queryByTestId('schedule-message-button')).not.toBeInTheDocument();
    });

    it('clears the composer when cancelled', async () => {
      const { messageComposer, startSchedulingAgain } = await renderComposer();
      await act(() => messageComposer.textComposer.setText('my unsent draft'));

      await startSchedulingAgain();
      await act(() =>
        fireEvent.click(screen.getByRole('button', { name: 'Cancel scheduling again' })),
      );

      expect(screen.queryByText('Schedule again')).not.toBeInTheDocument();
      expect(messageComposer.textComposer.text).toBe('');
    });

    it('opens the schedule dialog when saved, instead of sending', async () => {
      const { channel, startSchedulingAgain } = await renderComposer();
      const sendMessage = vi.spyOn(channel, 'sendMessage');

      await startSchedulingAgain();
      await act(() => fireEvent.click(screen.getByTestId('send-button')));

      expect(await screen.findByTestId('schedule-message-dialog')).toHaveTextContent(
        'Launch moved to Monday',
      );
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('opens the schedule dialog on Enter as well', async () => {
      const { channel, startSchedulingAgain } = await renderComposer();
      const sendMessage = vi.spyOn(channel, 'sendMessage');

      await startSchedulingAgain();
      await act(() =>
        fireEvent.keyDown(screen.getByRole('textbox'), { code: 'Enter', key: 'Enter' }),
      );

      expect(await screen.findByTestId('schedule-message-dialog')).toBeInTheDocument();
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('is sent, with no dialog, through useMessageComposerSubmitFn', async () => {
      const { messageComposer, startSchedulingAgain } = await renderComposer();
      const send = vi.spyOn(messageComposer, 'send').mockResolvedValue('sent');

      await startSchedulingAgain();
      await act(() => submitWithoutDialog?.());

      expect(send).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('schedule-message-dialog')).not.toBeInTheDocument();
    });

    it('schedules it from the dialog', async () => {
      const { failedMessage, messageComposer, startSchedulingAgain } =
        await renderComposer();
      const scheduleMessage = vi
        .spyOn(messageComposer, 'scheduleMessage')
        .mockResolvedValue({ scheduledMessage: failedMessage, status: 'scheduled' });

      await startSchedulingAgain();
      await act(() => fireEvent.click(screen.getByTestId('send-button')));
      await screen.findByTestId('schedule-message-dialog');
      await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

      expect(scheduleMessage).toHaveBeenCalledTimes(1);
    });
  });
});

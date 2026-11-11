import '../../..';
import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { ScheduledMessageErrorReason } from 'stream-chat';
import type {
  Channel as ChannelType,
  ScheduledMessageResponse,
  ScheduledMessageSubmitResult,
  StreamChat,
} from 'stream-chat';

import { axe } from '../../../../axe-helper';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { WithComponents } from '../../../context/WithComponents';
import { MessageComposer } from '../../MessageComposer';
import {
  convertDateToTimestamp,
  erroredScheduledMessageApi,
  generateScheduledMessage,
  generateUser,
  initClientWithChannels,
  sendScheduledMessageApi,
  setWSConnectionStatus,
  useMockedApis,
} from '../../../mock-builders';

const user = generateUser({ id: 'user-id' });

const WEDNESDAY_MORNING = new Date(2026, 9, 28, 10, 30);
const MONDAY_MORNING = new Date(2026, 10, 2, 13, 0);

const channelDataWith = (ownCapabilities: string[]) => ({
  channel: {
    id: 'general',
    own_capabilities: ownCapabilities,
    type: 'messaging',
  },
});

type SetupOptions = {
  canSchedule?: boolean;
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  text?: string;
};

const renderComposer = async ({
  canSchedule = true,
  components = {},
  text = 'Launch moved to Monday',
}: SetupOptions = {}) => {
  const ownCapabilities = canSchedule
    ? ['send-message', 'schedule-message']
    : ['send-message'];
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [channelDataWith(ownCapabilities)],
    customUser: user,
  });

  await act(() => {
    render(
      <Chat client={client}>
        <WithComponents overrides={components}>
          <Channel channel={channel}>
            <MessageComposer />
          </Channel>
        </WithComponents>
      </Chat>,
    );
  });

  if (text) {
    await act(() => channel.messageComposer.textComposer.setText(text));
  }

  return { channel, client };
};

const openMenu = async () => {
  await act(() => fireEvent.click(screen.getByTestId('schedule-message-button')));

  return screen.findByTestId('schedule-message-menu');
};

const openDialog = async () => {
  await openMenu();
  await act(() => fireEvent.click(screen.getByText('Custom time')));

  return screen.findByTestId('schedule-message-dialog');
};

const getNotifications = (client: StreamChat) =>
  client.notifications.store.getLatestValue().notifications;

const mockSchedule = (channel: ChannelType) =>
  vi.spyOn(channel.messageComposer, 'schedule');

const scheduledResult = (
  scheduledMessage: ScheduledMessageResponse,
): ScheduledMessageSubmitResult => ({ scheduledMessage, status: 'scheduled' });

describe('ScheduleMessageButton', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
    vi.setSystemTime(WEDNESDAY_MORNING);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('split send button', () => {
    it('renders the chevron next to the send button with the capability', async () => {
      await renderComposer();

      const chevron = screen.getByTestId('schedule-message-button');

      expect(screen.getByTestId('send-button')).toBeInTheDocument();
      expect(chevron).toHaveAttribute('aria-haspopup', 'menu');
      expect(chevron).toHaveAttribute('aria-expanded', 'false');
      expect(chevron.closest('.str-chat__split-send-button')).not.toBeNull();
    });

    it('keeps the single send button without the capability', async () => {
      await renderComposer({ canSchedule: false });

      expect(screen.getByTestId('send-button')).toBeInTheDocument();
      expect(screen.queryByTestId('schedule-message-button')).not.toBeInTheDocument();
      expect(document.querySelector('.str-chat__split-send-button')).toBeNull();
    });

    it('hides the chevron for a slash command', async () => {
      await renderComposer({ text: '/giphy hello' });

      expect(screen.queryByTestId('schedule-message-button')).not.toBeInTheDocument();
    });

    it('can be removed through ComponentContext', async () => {
      await renderComposer({ components: { ScheduleMessageButton: null } });

      expect(screen.getByTestId('send-button')).toBeInTheDocument();
      expect(screen.queryByTestId('schedule-message-button')).not.toBeInTheDocument();
    });

    it('still sends immediately from the send button', async () => {
      const { channel } = await renderComposer();
      const schedule = mockSchedule(channel);
      const sendMessage = vi
        .spyOn(channel, 'sendMessage')
        .mockResolvedValue(fromPartial({ message: { id: 'sent' } }));

      await act(() => fireEvent.click(screen.getByTestId('send-button')));

      await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
      expect(sendMessage.mock.calls[0][0].scheduled_at).toBeUndefined();
      expect(schedule).not.toHaveBeenCalled();
    });
  });

  describe('menu', () => {
    it('shows the heading, the presets and Custom time', async () => {
      await renderComposer();

      const menu = await openMenu();

      expect(menu).toHaveTextContent('Schedule message');
      expect(screen.getByText('Tomorrow at 09:00')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow at 13:00')).toBeInTheDocument();
      expect(screen.getByText('Monday at 09:00')).toBeInTheDocument();
      expect(screen.getByText('Custom time')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-message-button')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('labels the next-Monday preset with the weekday on a Monday', async () => {
      vi.setSystemTime(MONDAY_MORNING);
      await renderComposer();

      await openMenu();

      expect(screen.getByText('Tomorrow at 09:00')).toBeInTheDocument();
      expect(screen.getByText('Monday at 09:00')).toBeInTheDocument();
    });

    // the banner confirms it
    it('schedules at the picked preset without a notification', async () => {
      const { channel, client } = await renderComposer();
      const serverScheduledAt = new Date(2026, 9, 29, 9, 0);
      const scheduledMessage = generateScheduledMessage({
        cid: channel.cid,
        scheduled_at: convertDateToTimestamp(serverScheduledAt),
      });
      const schedule = mockSchedule(channel).mockResolvedValue(
        scheduledResult(scheduledMessage),
      );

      await openMenu();
      await act(() => fireEvent.click(screen.getByText('Tomorrow at 09:00')));

      expect(schedule).toHaveBeenCalledWith(new Date(2026, 9, 29, 9, 0));
      await waitFor(() =>
        expect(screen.queryByTestId('schedule-message-menu')).not.toBeInTheDocument(),
      );
      expect(getNotifications(client)).toEqual([]);
    });

    it('sends the composition with scheduled_at to the API', async () => {
      const { channel, client } = await renderComposer();
      const scheduledMessage = generateScheduledMessage({ cid: channel.cid });
      useMockedApis(client, [sendScheduledMessageApi(scheduledMessage)]);
      const sendMessage = vi.spyOn(channel, 'sendMessage');

      await openMenu();
      await act(() => fireEvent.click(screen.getByText('Tomorrow at 13:00')));

      await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
      expect(sendMessage.mock.calls[0][0].message.text).toBe('Launch moved to Monday');
      expect(sendMessage.mock.calls[0][0].scheduled_at).toEqual(
        new Date(2026, 9, 29, 13, 0),
      );
      await waitFor(() => expect(channel.messageComposer.textComposer.text).toBe(''));
    });

    it('refreshes the composer id when the server reports the id as taken', async () => {
      const { channel, client } = await renderComposer();
      useMockedApis(client, [
        erroredScheduledMessageApi(119, ScheduledMessageErrorReason.IdTaken),
      ]);
      const idBefore = channel.messageComposer.id;

      await openMenu();
      await act(() => fireEvent.click(screen.getByText('Tomorrow at 09:00')));

      await waitFor(() => expect(channel.messageComposer.id).not.toBe(idBefore));
      expect(channel.messageComposer.textComposer.text).toBe('Launch moved to Monday');
    });

    it('has no axe violations', async () => {
      await renderComposer();

      const menu = await openMenu();

      expect(await axe(menu)).toHaveNoViolations();
    });
  });

  describe('custom time dialog', () => {
    it('opens with the message preview, the default time and the time zone', async () => {
      await renderComposer();

      const dialog = await openDialog();

      expect(dialog).toHaveTextContent('Schedule message');
      expect(dialog).toHaveTextContent('Launch moved to Monday');
      expect(screen.getByLabelText('Date')).toHaveValue('2026-10-28');
      expect(screen.getByLabelText('Time')).toHaveValue('11:00');
      expect(dialog).toHaveTextContent('Sent in your time zone (GMT)');
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();
    });

    it('shows the picked date in the design format', async () => {
      await renderComposer();

      const dialog = await openDialog();
      fireEvent.change(screen.getByLabelText('Date'), {
        target: { value: '2026-11-03' },
      });

      expect(
        dialog.querySelector('.str-chat__schedule-message-dialog__date-value'),
      ).toHaveTextContent('Tue, Nov 3, 2026');
    });

    it('schedules at the picked date and time and closes', async () => {
      const { channel } = await renderComposer();
      const schedule = mockSchedule(channel).mockResolvedValue(
        scheduledResult(generateScheduledMessage({ cid: channel.cid })),
      );

      await openDialog();
      fireEvent.change(screen.getByLabelText('Date'), {
        target: { value: '2026-11-03' },
      });
      fireEvent.change(screen.getByLabelText('Time'), { target: { value: '16:45' } });
      await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

      expect(schedule).toHaveBeenCalledWith(new Date(2026, 10, 3, 16, 45));
      await waitFor(() =>
        expect(screen.queryByTestId('schedule-message-dialog')).not.toBeInTheDocument(),
      );
    });

    it('blocks a time before the minimum lead time', async () => {
      await renderComposer();

      await openDialog();
      fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:31' } });

      expect(screen.getByText('Choose a later time')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled();
    });

    it('blocks a time beyond the maximum lead time', async () => {
      await renderComposer();

      await openDialog();
      fireEvent.change(screen.getByLabelText('Date'), {
        target: { value: '2027-06-01' },
      });

      expect(screen.getByText('Choose an earlier time')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled();
    });

    it('keeps the dialog open and shows the error when scheduling fails', async () => {
      const { channel } = await renderComposer();
      const schedule = mockSchedule(channel).mockResolvedValue({
        error: new Error('failed'),
        status: 'failed',
      });

      const dialog = await openDialog();
      await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "Couldn't schedule message. Try again",
      );
      expect(screen.getByTestId('schedule-message-dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();

      schedule.mockResolvedValue(
        scheduledResult(generateScheduledMessage({ cid: channel.cid })),
      );
      await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

      expect(schedule).toHaveBeenCalledTimes(2);
      await waitFor(() =>
        expect(screen.queryByTestId('schedule-message-dialog')).not.toBeInTheDocument(),
      );
    });

    it('reports a failure once: in the dialog, not also as a notification', async () => {
      const { channel, client } = await renderComposer();
      const { messageComposer } = channel;
      // as the composer does, notifying of its own failure
      mockSchedule(channel).mockImplementation(() => {
        const error = new Error('failed');
        client.notifications.addError({
          message: 'Failed to schedule the message',
          origin: { context: { composer: messageComposer }, emitter: 'MessageComposer' },
        });
        return Promise.resolve({ error, status: 'failed' });
      });

      const dialog = await openDialog();
      await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "Couldn't schedule message. Try again",
      );
      expect(getNotifications(client)).toEqual([]);
    });

    it.each(['blocked', 'nothing-to-send'] as const)(
      'keeps the dialog open when the message is %s',
      async (status) => {
        const { channel } = await renderComposer();
        mockSchedule(channel).mockResolvedValue({ status });

        const dialog = await openDialog();
        await act(() =>
          fireEvent.click(screen.getByRole('button', { name: 'Schedule' })),
        );

        expect(await within(dialog).findByRole('alert')).toHaveTextContent(
          "Couldn't schedule message. Try again",
        );
        expect(screen.getByTestId('schedule-message-dialog')).toBeInTheDocument();
      },
    );

    it('opens the picker from anywhere in the field, its icons included', async () => {
      await renderComposer();

      const dialog = await openDialog();
      const time = screen.getByLabelText('Time') as HTMLInputElement;
      const showPicker = vi.fn();
      time.showPicker = showPicker;
      const caret = time
        .closest('.str-chat__form-text-input__wrapper')
        ?.querySelector('.str-chat__form-text-input__trailing');
      fireEvent.click(caret ?? dialog);

      expect(showPicker).toHaveBeenCalledTimes(1);
    });

    it('disables Schedule while offline and enables it again on reconnect', async () => {
      const { client } = await renderComposer();

      await openDialog();
      await act(() => setWSConnectionStatus(client, false));

      expect(
        screen.getByText("You're offline. Reconnect to schedule this message."),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled();

      await act(() => setWSConnectionStatus(client, true));

      expect(
        screen.queryByText("You're offline. Reconnect to schedule this message."),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();
    });

    it('closes without scheduling on Cancel', async () => {
      const { channel } = await renderComposer();
      const schedule = mockSchedule(channel);

      await openDialog();
      await act(() => fireEvent.click(screen.getByRole('button', { name: 'Cancel' })));

      expect(screen.queryByTestId('schedule-message-dialog')).not.toBeInTheDocument();
      expect(schedule).not.toHaveBeenCalled();
    });

    it('has no axe violations', async () => {
      await renderComposer();

      const dialog = await openDialog();

      expect(await axe(dialog)).toHaveNoViolations();
    });
  });
});

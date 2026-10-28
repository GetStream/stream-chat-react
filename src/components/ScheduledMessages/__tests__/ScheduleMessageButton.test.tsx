import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { ScheduledMessageErrorReason, SearchController } from 'stream-chat';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { axe } from '../../../../axe-helper';
import { Channel } from '../../Channel';
import { DialogManagerProvider, TranslationProvider } from '../../../context';
import { Streami18n } from '../../../i18n';
import { type ChatContextValue, ChatProvider } from '../../../context/ChatContext';
import { WithComponents } from '../../../context/WithComponents';
import { MessageComposer } from '../../MessageComposer';
import {
  dispatchConnectionChangedEvent,
  erroredScheduledMessageApi,
  generateChannel,
  generateScheduledMessage,
  generateUser,
  initClientWithChannels,
  sendScheduledMessageApi,
  useMockedApis,
} from '../../../mock-builders';

const user = generateUser({ id: 'user-id' });

const WEDNESDAY_MORNING = new Date(2026, 9, 28, 10, 30);

const channelDataWith = (ownCapabilities: string[]) =>
  generateChannel({
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

  const translators = await new Streami18n({ language: 'en' }).getTranslators();

  await act(() => {
    render(
      <WithComponents overrides={components}>
        <ChatProvider
          value={fromPartial<ChatContextValue>({
            channel,
            channelsQueryState: { queryInProgress: 'uninitialized' },
            client,
            getAppSettings: vi.fn(),
            latestMessageDatesByChannels: {},
            mutes: [],
            searchController: new SearchController(),
          })}
        >
          <TranslationProvider value={{ ...translators, userLanguage: 'en' }}>
            <DialogManagerProvider id='schedule-message-test-dialog-manager'>
              <Channel channel={channel}>
                <MessageComposer />
              </Channel>
            </DialogManagerProvider>
          </TranslationProvider>
        </ChatProvider>
      </WithComponents>,
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
      expect(sendMessage.mock.calls[0][1]?.scheduled_at).toBeUndefined();
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

    it('schedules at the picked preset and confirms with the server time', async () => {
      const { channel, client } = await renderComposer();
      const serverScheduledAt = new Date(2026, 9, 29, 9, 0);
      const scheduledMessage = generateScheduledMessage({
        cid: channel.cid,
        scheduled_at: serverScheduledAt.toISOString(),
      });
      const schedule = mockSchedule(channel).mockResolvedValue(scheduledMessage);

      await openMenu();
      await act(() => fireEvent.click(screen.getByText('Tomorrow at 09:00')));

      expect(schedule).toHaveBeenCalledWith(new Date(2026, 9, 29, 9, 0));
      await waitFor(() =>
        expect(getNotifications(client)).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: 'Scheduled for Tomorrow at 09:00',
              severity: 'success',
              type: 'api:scheduled-message:create:success',
            }),
          ]),
        ),
      );
      expect(screen.queryByTestId('schedule-message-menu')).not.toBeInTheDocument();
    });

    it('sends the composition with scheduled_at to the API', async () => {
      const { channel, client } = await renderComposer();
      const scheduledMessage = generateScheduledMessage({ cid: channel.cid });
      useMockedApis(client, [sendScheduledMessageApi(scheduledMessage)]);
      const sendMessage = vi.spyOn(channel, 'sendMessage');

      await openMenu();
      await act(() => fireEvent.click(screen.getByText('Tomorrow at 13:00')));

      await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
      expect(sendMessage.mock.calls[0][0].text).toBe('Launch moved to Monday');
      expect(sendMessage.mock.calls[0][1]?.scheduled_at).toBe(
        new Date(2026, 9, 29, 13, 0).toISOString(),
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

    it('schedules at the picked date and time and closes', async () => {
      const { channel } = await renderComposer();
      const schedule = mockSchedule(channel).mockResolvedValue(
        generateScheduledMessage({ cid: channel.cid }),
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
      const schedule = mockSchedule(channel).mockRejectedValue(new Error('failed'));

      await openDialog();
      await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "Couldn't schedule message. Try again",
      );
      expect(screen.getByTestId('schedule-message-dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeEnabled();

      schedule.mockResolvedValue(generateScheduledMessage({ cid: channel.cid }));
      await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

      expect(schedule).toHaveBeenCalledTimes(2);
      await waitFor(() =>
        expect(screen.queryByTestId('schedule-message-dialog')).not.toBeInTheDocument(),
      );
    });

    it('disables Schedule while offline and enables it again on reconnect', async () => {
      const { client } = await renderComposer();

      await openDialog();
      await act(() => dispatchConnectionChangedEvent(client, false));

      expect(
        screen.getByText("You're offline. Reconnect to schedule this message."),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeDisabled();

      await act(() => dispatchConnectionChangedEvent(client, true));

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

    it('renders a custom dialog from ComponentContext', async () => {
      const CustomDialog = () => <div data-testid='custom-schedule-dialog' />;
      await renderComposer({ components: { ScheduleMessageDialog: CustomDialog } });

      await openMenu();
      await act(() => fireEvent.click(screen.getByText('Custom time')));

      expect(await screen.findByTestId('custom-schedule-dialog')).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
      await renderComposer();

      const dialog = await openDialog();

      expect(await axe(dialog)).toHaveNoViolations();
    });
  });
});

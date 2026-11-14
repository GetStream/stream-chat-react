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
import {
  SCHEDULED_MESSAGE_FAILURE_REASON,
  SCHEDULED_MESSAGE_STATUS,
  StreamAPIError,
} from 'stream-chat';
import type { ScheduledMessageResponse, StreamChat } from 'stream-chat';

import { axe } from '../../../../axe-helper';
import {
  ChatProvider,
  DialogManagerProvider,
  TranslationProvider,
  useChatContext,
} from '../../../context';
import { WithComponents } from '../../../context/WithComponents';
import { Streami18n } from '../../../i18n';
import {
  convertDateToTimestamp,
  generateScheduledMessage,
  getTestClientWithUser,
  hydrateScheduledMessages,
  mockChatContext,
} from '../../../mock-builders';
import { SCHEDULED_MESSAGE_NOTIFICATION_TYPE, splitCid } from '../utils';
import { ScheduledMessageList } from '../ScheduledMessageList';
import { ScheduledMessageItem } from '../ScheduledMessageItem';
import type { ScheduledMessageItemProps } from '../ScheduledMessageItem';
import { defaultScheduledMessageActionSet } from '../ScheduledMessageActions';
import type { ScheduledMessageActionSetItem } from '../ScheduledMessageActions';

type OpenInComposer = NonNullable<ScheduledMessageItemProps['openInComposer']>;

const cid = 'messaging:general';

const ChannelScheduledMessageList = ({
  openInComposer,
}: {
  openInComposer?: OpenInComposer;
}) => {
  const { client } = useChatContext();
  return (
    <ScheduledMessageList
      openInComposer={openInComposer}
      scheduledMessages={client.channel(...splitCid(cid)).scheduledMessages}
    />
  );
};

const getChannel = (client: StreamChat) => client.channel('messaging', 'general');

const WEDNESDAY_MORNING = new Date(2026, 9, 28, 10, 30);

const notFoundError = new StreamAPIError('not found', {
  code: 16,
  response: fromPartial<NonNullable<StreamAPIError['response']>>({
    data: { code: 16 },
    status: 404,
  }),
  status: 404,
});

type RenderActionsOptions = {
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  openInComposer?: OpenInComposer;
  scheduledMessage?: ScheduledMessageResponse;
};

const renderActions = async ({
  components = {},
  openInComposer,
  scheduledMessage = generateScheduledMessage({
    cid,
    message: { custom: {}, text: 'Launch moved to Monday' },
    scheduled_at: convertDateToTimestamp(new Date(2026, 9, 29, 9, 0)),
  }),
}: RenderActionsOptions = {}) => {
  const client = await getTestClientWithUser({ id: 'user-id' });
  hydrateScheduledMessages(client, cid, [scheduledMessage]);
  client
    .channel('messaging', 'general')
    .state.partialNext({ ownCapabilities: ['send-message', 'schedule-message'] });

  const { t, tDateTimeParser } = await new Streami18n({ language: 'en' }).init();

  const view = render(
    <WithComponents overrides={components}>
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={{ t, tDateTimeParser, userLanguage: 'en' }}>
          <DialogManagerProvider id='scheduled-message-actions-test-dialog-manager'>
            <ChannelScheduledMessageList openInComposer={openInComposer} />
          </DialogManagerProvider>
        </TranslationProvider>
      </ChatProvider>
    </WithComponents>,
  );

  return { ...view, client, scheduledMessage };
};

const openActionsMenu = async () => {
  await act(() =>
    fireEvent.click(screen.getByTestId('scheduled-message-actions-button')),
  );

  return screen.findByTestId('scheduled-message-actions-menu');
};

const selectAction = async (action: string) => {
  await openActionsMenu();
  await act(() =>
    fireEvent.click(screen.getByTestId(`scheduled-message-action-${action}`)),
  );
};

const getNotificationTypes = (client: StreamChat) =>
  client.notifications.store.getLatestValue().notifications.map(({ type }) => type);

const getMenuLabels = () =>
  screen.getAllByRole('menuitem').map(({ textContent }) => textContent?.trim());

describe('ScheduledMessageActions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
    vi.setSystemTime(WEDNESDAY_MORNING);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('offers an Edit button and Reschedule, Send now and Delete for a scheduled message', async () => {
    await renderActions({ openInComposer: vi.fn() });

    await openActionsMenu();

    expect(screen.getByTestId('scheduled-message-edit-button')).toBeInTheDocument();
    expect(getMenuLabels()).toEqual(['Reschedule', 'Send now', 'Delete']);
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('leaves out Edit when the list has no edit handler', async () => {
    await renderActions();

    await openActionsMenu();

    expect(screen.queryByTestId('scheduled-message-edit-button')).not.toBeInTheDocument();
    expect(getMenuLabels()).toEqual(['Reschedule', 'Send now', 'Delete']);
  });

  describe('in a channel that allows neither sending nor scheduling', () => {
    // as a frozen channel does
    const removeComposeCapabilities = (client: StreamChat) =>
      act(() =>
        client.channel('messaging', 'general').state.partialNext({ ownCapabilities: [] }),
      );

    it('disables Edit, keeping it focusable and saying why', async () => {
      const openInComposer = vi.fn();
      const { client } = await renderActions({ openInComposer });
      removeComposeCapabilities(client);

      const edit = screen.getByTestId('scheduled-message-edit-button');
      fireEvent.click(edit);

      expect(edit).toHaveAttribute('aria-disabled', 'true');
      expect(edit).not.toBeDisabled();
      expect(edit).toHaveAccessibleDescription(
        "Unavailable: you can't send messages in this channel",
      );
      expect(openInComposer).not.toHaveBeenCalled();
    });

    it('disables Edit & reschedule of a failed message', async () => {
      const openInComposer = vi.fn();
      const { client } = await renderActions({
        openInComposer,
        scheduledMessage: generateScheduledMessage({
          cid,
          failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen,
          status: SCHEDULED_MESSAGE_STATUS.Failed,
        }),
      });
      removeComposeCapabilities(client);

      await selectAction('edit');

      const editAndReschedule = screen.getByTestId('scheduled-message-action-edit');
      expect(editAndReschedule).toHaveAttribute('aria-disabled', 'true');
      expect(editAndReschedule).toHaveAccessibleDescription(
        "Unavailable: you can't send messages in this channel",
      );
      expect(openInComposer).not.toHaveBeenCalled();
      // the menu stays open on the unavailable item
      expect(screen.getByTestId('scheduled-message-actions-menu')).toBeInTheDocument();
    });
  });

  it('offers no actions while the message is being sent', async () => {
    await renderActions({
      scheduledMessage: generateScheduledMessage({
        cid,
        status: SCHEDULED_MESSAGE_STATUS.Sending,
      }),
    });

    expect(
      screen.queryByTestId('scheduled-message-actions-button'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('scheduled-message-edit-button')).not.toBeInTheDocument();
  });

  it('offers Copy and Delete for a message in a deleted channel', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn() },
    });
    await renderActions({
      openInComposer: vi.fn(),
      scheduledMessage: generateScheduledMessage({
        cid,
        failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted,
        message: { custom: {}, text: 'Launch moved to Monday' },
        status: SCHEDULED_MESSAGE_STATUS.Failed,
      }),
    });

    await openActionsMenu();

    expect(getMenuLabels()).toEqual(['Copy text', 'Delete']);
    // Delete stands apart in a two-item menu too
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('hands the scheduled message to the edit handler', async () => {
    const openInComposer = vi.fn();
    const { scheduledMessage } = await renderActions({ openInComposer });

    await act(() => fireEvent.click(screen.getByTestId('scheduled-message-edit-button')));

    expect(openInComposer).toHaveBeenCalledWith(scheduledMessage);
  });

  it('sends the message now and confirms it', async () => {
    const { client, scheduledMessage } = await renderActions();
    const sendNow = vi
      .spyOn(getChannel(client), 'sendScheduledMessageNow')
      .mockResolvedValue(scheduledMessage);

    await selectAction('sendNow');

    expect(sendNow).toHaveBeenCalledWith(scheduledMessage.id);
    await waitFor(() =>
      expect(getNotificationTypes(client)).toContain(
        SCHEDULED_MESSAGE_NOTIFICATION_TYPE.sendNowSucceeded,
      ),
    );
  });

  it('reports a send-now failure with its error', async () => {
    const { client } = await renderActions();
    vi.spyOn(getChannel(client), 'sendScheduledMessageNow').mockRejectedValue(
      notFoundError,
    );

    await selectAction('sendNow');

    await waitFor(() =>
      expect(client.notifications.store.getLatestValue().notifications).toEqual([
        expect.objectContaining({
          // the error's own copy, given where the notification is made
          message: 'Already sent',
          originalError: notFoundError,
          type: SCHEDULED_MESSAGE_NOTIFICATION_TYPE.sendNowFailed,
        }),
      ]),
    );
  });

  it('deletes only after the deletion is confirmed', async () => {
    const { client, scheduledMessage } = await renderActions();
    const deleteScheduledMessage = vi
      .spyOn(getChannel(client), 'deleteScheduledMessage')
      .mockResolvedValue(scheduledMessage);

    await selectAction('delete');
    const alert = await screen.findByTestId('delete-scheduled-message-alert');

    expect(alert).toHaveTextContent('Delete scheduled message?');
    expect(alert).toHaveTextContent("This message won't be sent. This can't be undone.");
    expect(deleteScheduledMessage).not.toHaveBeenCalled();

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Delete' })));

    expect(deleteScheduledMessage).toHaveBeenCalledWith(scheduledMessage.id);
  });

  it('keeps the message when the deletion is cancelled', async () => {
    const { client } = await renderActions();
    const deleteScheduledMessage = vi.spyOn(getChannel(client), 'deleteScheduledMessage');

    await selectAction('delete');
    await screen.findByTestId('delete-scheduled-message-alert');
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Cancel' })));

    expect(deleteScheduledMessage).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId('delete-scheduled-message-alert'),
    ).not.toBeInTheDocument();
  });

  it('reschedules from the dialog pre-filled with the current time', async () => {
    const { client, scheduledMessage } = await renderActions();
    const updateScheduledMessage = vi
      .spyOn(getChannel(client), 'updateScheduledMessage')
      .mockResolvedValue(scheduledMessage);

    await selectAction('reschedule');
    const dialog = await screen.findByTestId('schedule-message-dialog');

    expect(dialog).toHaveTextContent('Reschedule message');
    expect(dialog).toHaveTextContent('Scheduled for Thu, Oct 29 at 09:00');
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-29');
    expect(screen.getByLabelText('Time')).toHaveValue('09:00');

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '14:30' } });
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save' })));

    expect(updateScheduledMessage).toHaveBeenCalledWith(scheduledMessage.id, {
      scheduled_at: new Date(2026, 9, 29, 14, 30),
    });
    await waitFor(() =>
      expect(screen.queryByTestId('schedule-message-dialog')).not.toBeInTheDocument(),
    );
  });

  it('keeps the reschedule dialog open and reports a failure', async () => {
    const { client } = await renderActions();
    vi.spyOn(getChannel(client), 'updateScheduledMessage').mockRejectedValue(
      notFoundError,
    );

    await selectAction('reschedule');
    await screen.findByTestId('schedule-message-dialog');
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save' })));

    // the error's own copy: the message was sent meanwhile
    expect(await screen.findByText('Already sent')).toBeInTheDocument();
    // the dialog reports it, so it is not repeated as a notification
    expect(getNotificationTypes(client)).toEqual([]);
  });

  it('clears a reschedule failure once another time is picked', async () => {
    const { client } = await renderActions();
    vi.spyOn(getChannel(client), 'updateScheduledMessage').mockRejectedValue(
      notFoundError,
    );

    await selectAction('reschedule');
    await screen.findByTestId('schedule-message-dialog');
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save' })));
    expect(await screen.findByText('Already sent')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '14:30' } });

    expect(screen.queryByText('Already sent')).not.toBeInTheDocument();
  });

  it('saves the exact send time when neither field changes', async () => {
    const sendTime = new Date(2026, 9, 29, 9, 0, 45, 500);
    const scheduledMessage = generateScheduledMessage({
      cid,
      scheduled_at: convertDateToTimestamp(sendTime),
    });
    const { client } = await renderActions({ scheduledMessage });
    const updateScheduledMessage = vi
      .spyOn(getChannel(client), 'updateScheduledMessage')
      .mockResolvedValue(scheduledMessage);

    await selectAction('reschedule');
    await screen.findByTestId('schedule-message-dialog');
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save' })));

    expect(updateScheduledMessage).toHaveBeenCalledWith(scheduledMessage.id, {
      scheduled_at: sendTime,
    });
  });

  it('reports a reschedule failure without a specific reason generically', async () => {
    const { client } = await renderActions();
    vi.spyOn(getChannel(client), 'updateScheduledMessage').mockRejectedValue(
      new Error('Network Error'),
    );

    await selectAction('reschedule');
    await screen.findByTestId('schedule-message-dialog');
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Save' })));

    expect(
      await screen.findByText("Couldn't reschedule the message. Try again"),
    ).toBeInTheDocument();
  });

  it('explains in place of the time zone why a reschedule is too soon', async () => {
    await renderActions();

    await selectAction('reschedule');
    const dialog = await screen.findByTestId('schedule-message-dialog');
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '00:00' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2020-01-01' } });

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      "Pick a later time. Editing can't send a message right away.",
    );
    expect(dialog).not.toHaveTextContent('Sent in your time zone');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('copies the text of a message from a deleted channel', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    await renderActions({
      scheduledMessage: generateScheduledMessage({
        cid,
        failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted,
        message: { custom: {}, text: 'Launch moved to Monday' },
        status: SCHEDULED_MESSAGE_STATUS.Failed,
      }),
    });

    await selectAction('copyMessageText');

    expect(writeText).toHaveBeenCalledWith('Launch moved to Monday');
  });

  it('reports a copy that fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const { client } = await renderActions({
      scheduledMessage: generateScheduledMessage({
        cid,
        failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted,
        message: { custom: {}, text: 'Launch moved to Monday' },
        status: SCHEDULED_MESSAGE_STATUS.Failed,
      }),
    });

    await selectAction('copyMessageText');

    await waitFor(() =>
      expect(getNotificationTypes(client)).toEqual([
        SCHEDULED_MESSAGE_NOTIFICATION_TYPE.copyFailed,
      ]),
    );
  });

  it('takes its actions from scheduledMessageActionSet', async () => {
    const copyLink = vi.fn();
    const CopyLink = () => (
      <button onClick={copyLink} role='menuitem' type='button'>
        Copy link
      </button>
    );
    const scheduledMessageActionSet: ScheduledMessageActionSetItem[] = [
      ...defaultScheduledMessageActionSet.filter(
        (action) =>
          action.placement === 'quick-dropdown-toggle' || action.type !== 'sendNow',
      ),
      { Component: CopyLink, placement: 'dropdown', type: 'copyLink' },
    ];
    await renderActions({
      components: {
        ScheduledMessageItem: (props: ScheduledMessageItemProps) => (
          <ScheduledMessageItem
            {...props}
            scheduledMessageActionSet={scheduledMessageActionSet}
          />
        ),
      },
    });

    await openActionsMenu();

    expect(getMenuLabels()).toEqual(['Reschedule', 'Delete', 'Copy link']);
  });

  it('has no accessibility violations with the menu open', async () => {
    const { container } = await renderActions({ openInComposer: vi.fn() });

    await openActionsMenu();

    expect(await axe(container)).toHaveNoViolations();
  });
});

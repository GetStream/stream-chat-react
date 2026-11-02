import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ErrorFromResponse,
  ScheduledMessageFailureReason,
  ScheduledMessageStatus,
} from 'stream-chat';
import type { ScheduledMessageResponse, StreamChat } from 'stream-chat';

import { axe } from '../../../../axe-helper';
import {
  ChatProvider,
  DialogManagerProvider,
  TranslationProvider,
} from '../../../context';
import { WithComponents } from '../../../context/WithComponents';
import { Streami18n } from '../../../i18n';
import {
  generateScheduledMessage,
  getTestClientWithUser,
  mockChatContext,
} from '../../../mock-builders';
import { ScheduledMessageNotificationType } from '../constants';
import { ScheduledMessageList } from '../ScheduledMessageList';
import type { EditScheduledMessage } from '../types';

const cid = 'messaging:general';

const WEDNESDAY_MORNING = new Date(2026, 9, 28, 10, 30);

const notFoundError = new ErrorFromResponse('not found', {
  code: 16,
  response: { data: { code: 16 }, status: 404 } as never,
  status: 404,
});

type RenderActionsOptions = {
  components?: Parameters<typeof WithComponents>[0]['overrides'];
  onEdit?: EditScheduledMessage;
  scheduledMessage?: ScheduledMessageResponse;
};

const renderActions = async ({
  components = {},
  onEdit,
  scheduledMessage = generateScheduledMessage({
    cid,
    message: { text: 'Launch moved to Monday' },
    scheduled_at: new Date(2026, 9, 29, 9, 0).toISOString(),
  }),
}: RenderActionsOptions = {}) => {
  const client = await getTestClientWithUser({ id: 'user-id' });
  client.scheduledMessages.upsertToState(scheduledMessage);

  const translators = await new Streami18n({ language: 'en' }).getTranslators();

  const view = render(
    <WithComponents overrides={components}>
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={{ ...translators, userLanguage: 'en' }}>
          <DialogManagerProvider id='scheduled-message-actions-test-dialog-manager'>
            <ScheduledMessageList cid={cid} onEdit={onEdit} />
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

  it('offers Edit, Reschedule, Send now and Delete for a scheduled message', async () => {
    await renderActions({ onEdit: vi.fn() });

    await openActionsMenu();

    expect(getMenuLabels()).toEqual(['Edit', 'Reschedule', 'Send now', 'Delete']);
  });

  it('leaves out Edit when the list has no edit handler', async () => {
    await renderActions();

    await openActionsMenu();

    expect(getMenuLabels()).toEqual(['Reschedule', 'Send now', 'Delete']);
  });

  it('disables the actions while the message is being sent', async () => {
    await renderActions({
      scheduledMessage: generateScheduledMessage({
        cid,
        status: ScheduledMessageStatus.Sending,
      }),
    });

    expect(screen.getByTestId('scheduled-message-actions-button')).toBeDisabled();
  });

  it('offers Copy and Delete for a message in a deleted channel', async () => {
    await renderActions({
      onEdit: vi.fn(),
      scheduledMessage: generateScheduledMessage({
        cid,
        failure_reason: ScheduledMessageFailureReason.ChannelDeleted,
        status: ScheduledMessageStatus.Failed,
      }),
    });

    await openActionsMenu();

    expect(getMenuLabels()).toEqual(['Copy Message', 'Delete']);
  });

  it('hands the scheduled message to the edit handler', async () => {
    const onEdit = vi.fn();
    const { scheduledMessage } = await renderActions({ onEdit });

    await selectAction('edit');

    expect(onEdit).toHaveBeenCalledWith(scheduledMessage);
  });

  it('sends the message now and confirms it', async () => {
    const { client, scheduledMessage } = await renderActions();
    const sendNow = vi
      .spyOn(client.scheduledMessages, 'sendScheduledMessageNow')
      .mockResolvedValue(scheduledMessage);

    await selectAction('send_now');

    expect(sendNow).toHaveBeenCalledWith(scheduledMessage.id);
    await waitFor(() =>
      expect(getNotificationTypes(client)).toContain(
        ScheduledMessageNotificationType.SendNowSucceeded,
      ),
    );
  });

  it('reports a send-now failure with its error', async () => {
    const { client } = await renderActions();
    vi.spyOn(client.scheduledMessages, 'sendScheduledMessageNow').mockRejectedValue(
      notFoundError,
    );

    await selectAction('send_now');

    await waitFor(() =>
      expect(client.notifications.store.getLatestValue().notifications).toEqual([
        expect.objectContaining({
          originalError: notFoundError,
          type: ScheduledMessageNotificationType.SendNowFailed,
        }),
      ]),
    );
  });

  it('deletes only after the deletion is confirmed', async () => {
    const { client, scheduledMessage } = await renderActions();
    const deleteScheduledMessage = vi
      .spyOn(client.scheduledMessages, 'deleteScheduledMessage')
      .mockResolvedValue(scheduledMessage);

    await selectAction('delete');
    const alert = await screen.findByTestId('delete-scheduled-message-alert');

    expect(alert).toHaveTextContent("This message won't be sent.");
    expect(deleteScheduledMessage).not.toHaveBeenCalled();

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Delete' })));

    expect(deleteScheduledMessage).toHaveBeenCalledWith(scheduledMessage.id);
  });

  it('keeps the message when the deletion is cancelled', async () => {
    const { client } = await renderActions();
    const deleteScheduledMessage = vi.spyOn(
      client.scheduledMessages,
      'deleteScheduledMessage',
    );

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
      .spyOn(client.scheduledMessages, 'updateScheduledMessage')
      .mockResolvedValue(scheduledMessage);

    await selectAction('reschedule');
    const dialog = await screen.findByTestId('schedule-message-dialog');

    expect(dialog).toHaveTextContent('Reschedule message');
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-29');
    expect(screen.getByLabelText('Time')).toHaveValue('09:00');

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '14:30' } });
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

    expect(updateScheduledMessage).toHaveBeenCalledWith(scheduledMessage.id, {
      scheduled_at: new Date(2026, 9, 29, 14, 30).toISOString(),
    });
    await waitFor(() =>
      expect(screen.queryByTestId('schedule-message-dialog')).not.toBeInTheDocument(),
    );
  });

  it('keeps the reschedule dialog open and reports a failure', async () => {
    const { client } = await renderActions();
    vi.spyOn(client.scheduledMessages, 'updateScheduledMessage').mockRejectedValue(
      notFoundError,
    );

    await selectAction('reschedule');
    await screen.findByTestId('schedule-message-dialog');
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Schedule' })));

    expect(
      await screen.findByText("Couldn't reschedule the message. Try again"),
    ).toBeInTheDocument();
    expect(getNotificationTypes(client)).toContain(
      ScheduledMessageNotificationType.RescheduleFailed,
    );
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
        failure_reason: ScheduledMessageFailureReason.ChannelDeleted,
        message: { text: 'Launch moved to Monday' },
        status: ScheduledMessageStatus.Failed,
      }),
    });

    await selectAction('copy');

    expect(writeText).toHaveBeenCalledWith('Launch moved to Monday');
  });

  it('renders the delete confirmation through the DeleteScheduledMessageAlert slot', async () => {
    const CustomAlert = () => <div data-testid='custom-delete-alert' />;
    await renderActions({ components: { DeleteScheduledMessageAlert: CustomAlert } });

    await selectAction('delete');

    expect(await screen.findByTestId('custom-delete-alert')).toBeInTheDocument();
  });

  it('renders the reschedule dialog through the RescheduleMessageDialog slot', async () => {
    const CustomDialog = () => <div data-testid='custom-reschedule-dialog' />;
    await renderActions({ components: { RescheduleMessageDialog: CustomDialog } });

    await selectAction('reschedule');

    expect(await screen.findByTestId('custom-reschedule-dialog')).toBeInTheDocument();
  });

  it('has no accessibility violations with the menu open', async () => {
    const { container } = await renderActions({ onEdit: vi.fn() });

    await openActionsMenu();

    expect(await axe(container)).toHaveNoViolations();
  });
});

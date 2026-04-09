import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { EndPollAlert } from '../EndPollAlert';
import {
  ChatProvider,
  ModalContextProvider,
  PollProvider,
  TranslationProvider,
} from '../../../../context';
import {
  generatePoll,
  generateUser,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';
import { Poll } from 'stream-chat';

describe('EndPollAlert', () => {
  it('closes modal and notifies on successful poll end', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll({ created_by_id: user.id, is_closed: false });
    const poll = new Poll({ client, poll: pollData });
    vi.spyOn(poll, 'close').mockResolvedValue(undefined);
    const close = vi.fn();
    const addSpy = vi.spyOn(client.notifications, 'add');

    render(
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={mockTranslationContextValue({ t: (k: string) => k })}>
          <PollProvider poll={poll}>
            <ModalContextProvider value={{ close }}>
              <EndPollAlert />
            </ModalContextProvider>
          </PollProvider>
        </TranslationProvider>
      </ChatProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('end-poll-alert-end-vote-button'));
    });

    await waitFor(() => {
      expect(poll.close).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Poll ended',
          options: expect.objectContaining({ severity: 'success' }),
        }),
      );
    });
  });

  it('notifies on poll end failure without closing', async () => {
    const user = generateUser();
    const client = await getTestClientWithUser(user);
    const pollData = generatePoll({ created_by_id: user.id, is_closed: false });
    const poll = new Poll({ client, poll: pollData });
    vi.spyOn(poll, 'close').mockRejectedValueOnce(new Error('end failed'));
    const close = vi.fn();
    const addSpy = vi.spyOn(client.notifications, 'add');

    render(
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={mockTranslationContextValue({ t: (k: string) => k })}>
          <PollProvider poll={poll}>
            <ModalContextProvider value={{ close }}>
              <EndPollAlert />
            </ModalContextProvider>
          </PollProvider>
        </TranslationProvider>
      </ChatProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('end-poll-alert-end-vote-button'));
    });

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to end the poll',
          options: expect.objectContaining({ severity: 'error' }),
        }),
      );
    });
    expect(close).not.toHaveBeenCalled();
  });
});

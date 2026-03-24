// @ts-nocheck
import React from 'react';
import { Poll } from 'stream-chat';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { SuggestPollOptionPrompt } from '../PollActions';
import { ChatProvider, PollProvider, TranslationProvider } from '../../../context';
import { generatePoll } from '../../../mock-builders';

const SUBMIT_BUTTON_TEXT = 'Send';

const newlyTypedValue = 'XX';

const t = (v) => v;

const renderComponent = ({ client, poll, props }) =>
  render(
    <ChatProvider value={{ client }}>
      <TranslationProvider value={{ t }}>
        <PollProvider poll={poll}>
          <SuggestPollOptionPrompt {...props} />
        </PollProvider>
      </TranslationProvider>
    </ChatProvider>,
  );

describe('SuggestPollOptionPrompt', () => {
  afterEach(vi.resetAllMocks);

  it('renders with empty input that is updated and submitted', async () => {
    const createPollOptionSpy = vi
      .fn()
      .mockResolvedValue({ poll_option: { id: 'new-poll-option-id' } });
    const client = { createPollOption: createPollOptionSpy };
    const poll = new Poll({
      client,
      poll: generatePoll(),
    });
    const { container } = renderComponent({ client, poll });
    const input = container.querySelector('input');
    expect(input).toHaveValue('');
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(SUBMIT_BUTTON_TEXT);

    act(() => {
      fireEvent.change(input, { target: { value: newlyTypedValue } });
    });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
      expect(submitButton).toHaveTextContent(SUBMIT_BUTTON_TEXT);
    });

    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(createPollOptionSpy).toHaveBeenCalledWith(poll.id, {
        text: newlyTypedValue,
      });
    });
  });
});

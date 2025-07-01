import React from 'react';
import { Poll } from 'stream-chat';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SuggestPollOptionForm } from '../PollActions';
import { ChatProvider, PollProvider, TranslationProvider } from '../../../context';
import { generatePoll } from '../../../mock-builders';

const SUBMIT_BUTTON_TEXT = 'Send';

const close = jest.fn();
const messageId = 'messageId';
const newlyTypedValue = 'XX';

const t = (v) => v;

const renderComponent = ({ client, poll, props }) =>
  render(
    <ChatProvider value={{ client }}>
      <TranslationProvider value={{ t }}>
        <PollProvider poll={poll}>
          <SuggestPollOptionForm close={close} messageId={messageId} {...props} />
        </PollProvider>
      </TranslationProvider>
    </ChatProvider>,
  );

describe('SuggestPollOptionForm', () => {
  afterEach(jest.resetAllMocks);

  it('renders with empty input that is updated and submitted', async () => {
    const createdPollOptionId = 'new-poll-option-id';
    const createPollOptionSpy = jest
      .fn()
      .mockResolvedValue({ poll_option: { id: createdPollOptionId } });
    const client = { createPollOption: createPollOptionSpy };
    const poll = new Poll({
      client,
      poll: generatePoll(),
    });
    const castVoteSpy = jest.spyOn(poll, 'castVote').mockImplementation();
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
      expect(castVoteSpy).toHaveBeenCalledWith(createdPollOptionId, messageId);
    });
  });
});

import React from 'react';
import { Poll } from 'stream-chat';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddCommentForm } from '../PollActions';
import { PollProvider, TranslationProvider } from '../../../context';
import { generatePoll } from '../../../mock-builders';

const close = jest.fn();
const messageId = 'messageId';
const newlyTypedValue = 'XX';

const t = (v) => v;

const renderComponent = ({ poll, props }) =>
  render(
    <TranslationProvider value={{ t }}>
      <PollProvider poll={poll}>
        <AddCommentForm close={close} messageId={messageId} {...props} />
      </PollProvider>
    </TranslationProvider>,
  );

describe('AddCommentForm', () => {
  afterEach(jest.resetAllMocks);

  it('renders update form for existing comment and submits it', async () => {
    const poll = new Poll({ client: {}, poll: generatePoll() });
    const addAnswerSpy = jest.spyOn(poll, 'addAnswer').mockImplementation();
    const { container } = renderComponent({ poll });
    const input = container.querySelector('input');
    expect(input).toHaveValue(poll.data.ownAnswer.text);
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Send');

    act(() => {
      fireEvent.change(input, { target: { value: newlyTypedValue } });
    });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
      expect(submitButton).toHaveTextContent('Send');
    });

    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(addAnswerSpy).toHaveBeenCalledWith(newlyTypedValue, messageId);
    });
  });

  it('renders form to add a new answer and submits it', async () => {
    const poll = new Poll({ client: {}, poll: generatePoll({ own_votes: [] }) });
    const addAnswerSpy = jest.spyOn(poll, 'addAnswer').mockImplementation();
    const { container } = renderComponent({ poll });
    const input = container.querySelector('input');
    expect(input).toHaveValue('');
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Send');
    act(() => {
      fireEvent.change(input, { target: { value: newlyTypedValue } });
    });
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
      expect(submitButton).toHaveTextContent('Send');
    });
    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(addAnswerSpy).toHaveBeenCalledWith(newlyTypedValue, messageId);
    });
  });
});

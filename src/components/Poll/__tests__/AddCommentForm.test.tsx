import React from 'react';
import { Poll } from 'stream-chat';
import type { StreamChat } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { AddCommentPrompt } from '../PollActions';
import { PollProvider, TranslationProvider } from '../../../context';
import { generatePoll } from '../../../mock-builders';

const close = vi.fn();
const messageId = 'messageId';
const newlyTypedValue = 'XX';

const t = ((v: string) => v) as any;

const renderComponent = ({ poll, props }: any = {}) =>
  render(
    <TranslationProvider value={{ t } as any}>
      <PollProvider poll={poll}>
        <AddCommentPrompt close={close} messageId={messageId} {...props} />
      </PollProvider>
    </TranslationProvider>,
  );

describe('AddCommentPrompt', () => {
  afterEach(vi.resetAllMocks);

  it('renders update form for existing comment and submits it', async () => {
    const poll = new Poll({ client: fromPartial<StreamChat>({}), poll: generatePoll() });
    const addAnswerSpy = vi.spyOn(poll, 'addAnswer').mockResolvedValue(undefined!);
    const { container } = renderComponent({ poll });
    const input = container.querySelector('input');
    expect(input).toHaveValue((poll.data.ownAnswer as any).text);
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Update');

    act(() => {
      fireEvent.change(input, { target: { value: newlyTypedValue } });
    });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
      expect(submitButton).toHaveTextContent('Update');
    });

    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(addAnswerSpy).toHaveBeenCalledWith(newlyTypedValue, messageId);
    });
  });

  it('renders form to add a new answer and submits it', async () => {
    const poll = new Poll({
      client: fromPartial<StreamChat>({}),
      poll: generatePoll({ own_votes: [] }),
    });
    const addAnswerSpy = vi.spyOn(poll, 'addAnswer').mockResolvedValue(undefined!);
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

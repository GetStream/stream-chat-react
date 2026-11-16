import React from 'react';
import { Poll } from 'stream-chat';
import type { StreamChat } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { SuggestPollOptionPrompt } from '../PollActions';
import { ChatProvider, PollProvider, TranslationProvider } from '../../../context';
import type { TranslationContextValue } from '../../../context';
import {
  generatePoll,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { mockT } from '../../../mock-builders/translator';

const SUBMIT_BUTTON_TEXT = 'Send';

const newlyTypedValue = 'XX';

const t = mockT as TranslationContextValue['t'];

const renderComponent = ({ client, poll, props, userLanguage }: any) =>
  render(
    <ChatProvider value={mockChatContext({ client })}>
      <TranslationProvider value={mockTranslationContextValue({ t, userLanguage })}>
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
    const client = fromPartial<StreamChat>({ createPollOption: createPollOptionSpy });
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
      expect(createPollOptionSpy).toHaveBeenCalledWith(
        { poll_id: poll.id },
        { text: newlyTypedValue },
      );
    });
  });

  it('rejects an option whose translated text already exists', async () => {
    const createPollOptionSpy = vi.fn();
    const client = fromPartial<StreamChat>({ createPollOption: createPollOptionSpy });
    const poll = new Poll({
      client,
      poll: generatePoll({
        options: [{ id: 'berlin', text: 'Berlín', text_i18n: { en_text: 'Berlin' } }],
      }),
    });
    const { container, findByText } = renderComponent({
      client,
      poll,
      userLanguage: 'en',
    });
    const input = container.querySelector('input');

    act(() => {
      fireEvent.change(input, { target: { value: 'Berlin' } });
    });

    expect(await findByText('Option already exists')).toBeInTheDocument();
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
    expect(createPollOptionSpy).not.toHaveBeenCalled();
  });
});

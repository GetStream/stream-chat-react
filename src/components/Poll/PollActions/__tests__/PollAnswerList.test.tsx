import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Poll } from 'stream-chat';
import type { PollVoteResponseData } from 'stream-chat';

import { PollAnswerList } from '../PollAnswerList';
import { AriaLiveAnnouncerProvider, AriaLiveOutlet } from '../../../Accessibility';
import {
  ChatProvider,
  PollProvider,
  TranslationProvider,
  WithComponents,
} from '../../../../context';
import type { ComponentContextValue } from '../../../../context/ComponentContext';
import {
  generatePoll,
  generateUser,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';
import { mockT } from '../../../../mock-builders/translator';

type QueryAnswersResult = Awaited<ReturnType<Poll['queryAnswers']>>;

const answer = {
  answer_text: 'Pizza, obviously',
  created_at: '2024-10-22T15:58:27.756166Z',
  id: 'answer-1',
  is_answer: true,
  poll_id: 'poll-1',
  updated_at: '2024-10-22T15:58:27.756166Z',
  user: { id: 'other-user', name: 'Other User' },
  user_id: 'other-user',
} as unknown as PollVoteResponseData;

const answersPage = (
  votes: PollVoteResponseData[],
  next?: string,
): Promise<QueryAnswersResult> =>
  Promise.resolve({ duration: '', next, votes } as QueryAnswersResult);

const pending = () => new Promise<QueryAnswersResult>(() => undefined);

const renderAnswerList = async ({
  overrides = {},
  queryAnswers,
}: {
  overrides?: Partial<ComponentContextValue>;
  queryAnswers: Poll['queryAnswers'];
}) => {
  const client = await getTestClientWithUser(generateUser());
  const poll = new Poll({ client, poll: generatePoll() });
  const queryAnswersSpy = vi.spyOn(poll, 'queryAnswers').mockImplementation(queryAnswers);

  const result = render(
    <AriaLiveAnnouncerProvider>
      <AriaLiveOutlet />
      <ChatProvider value={mockChatContext({ client })}>
        <TranslationProvider value={mockTranslationContextValue({ t: mockT })}>
          <PollProvider poll={poll}>
            <WithComponents overrides={overrides}>
              <PollAnswerList onUpdateOwnAnswerClick={vi.fn()} />
            </WithComponents>
          </PollProvider>
        </TranslationProvider>
      </ChatProvider>
    </AriaLiveAnnouncerProvider>,
  );

  return { ...result, client, queryAnswersSpy };
};

/** jsdom has no layout: a root with an `offsetParent` reads as scrolled to its bottom edge. */
const scrollToBottom = (container: HTMLElement) => {
  const root = container.querySelector(
    '.str-chat__infinite-scroll-paginator',
  ) as HTMLElement;
  Object.defineProperty(root, 'offsetParent', {
    configurable: true,
    value: document.body,
  });
  fireEvent.scroll(root);
};

describe('PollAnswerList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the loading state inside the answer list while the first page loads', async () => {
    const { container } = await renderAnswerList({ queryAnswers: pending });

    expect(
      container.querySelector(
        '.str-chat__poll-answer-list .str-chat__loading-indicator-placeholder .str-chat__loading-indicator',
      ),
    ).toBeInTheDocument();
    expect(container.querySelector('.str-chat__poll-answer')).not.toBeInTheDocument();
  });

  it('shows the ListLoadErrorUI, not the raw error, when the first page fails', async () => {
    await renderAnswerList({
      queryAnswers: () => Promise.reject(new Error('answers failed')),
    });

    expect(await screen.findByText("Couldn't load the list")).toBeInTheDocument();
    expect(screen.queryByText('answers failed')).not.toBeInTheDocument();
    expect(screen.queryByText('No comments yet')).not.toBeInTheDocument();
  });

  it('queries the first page again on Try again and shows the loaded answers', async () => {
    const queryAnswers = vi
      .fn<Poll['queryAnswers']>()
      .mockRejectedValueOnce(new Error('answers failed'))
      .mockImplementationOnce(() => answersPage([answer]));
    const { queryAnswersSpy } = await renderAnswerList({ queryAnswers });

    const retryButton = await screen.findByRole('button', { name: 'Try again' });
    fireEvent.click(retryButton);

    expect(await screen.findByText('Pizza, obviously')).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load the list")).not.toBeInTheDocument();
    expect(queryAnswersSpy).toHaveBeenCalledTimes(2);
    expect(queryAnswersSpy.mock.calls[1][0]?.options).toBeUndefined();
  });

  it('announces a retry that loads the comments', async () => {
    const queryAnswers = vi
      .fn<Poll['queryAnswers']>()
      .mockRejectedValueOnce(new Error('answers failed'))
      .mockImplementationOnce(() => answersPage([answer]));
    await renderAnswerList({ queryAnswers });

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Comments loaded')).toBeInTheDocument();
  });

  it('keeps the error and its focused Try again button while a retry runs and when it fails', async () => {
    let rejectRetry: (error: Error) => void = () => undefined;
    const queryAnswers = vi
      .fn<Poll['queryAnswers']>()
      .mockRejectedValueOnce(new Error('answers failed'))
      .mockImplementationOnce(
        () =>
          new Promise<QueryAnswersResult>((_, reject) => {
            rejectRetry = reject;
          }),
      );
    await renderAnswerList({ queryAnswers });
    const retryButton = await screen.findByRole('button', { name: 'Try again' });
    retryButton.focus();

    fireEvent.click(retryButton);
    expect(retryButton).toHaveAttribute('aria-busy', 'true');

    await act(async () => {
      rejectRetry(new Error('answers failed again'));
      await Promise.resolve();
    });

    await vi.waitFor(() => expect(retryButton).toHaveAttribute('aria-busy', 'false'));
    expect(retryButton).toBeInTheDocument();
    expect(document.activeElement).toBe(retryButton);
    expect(screen.queryByText('Comments loaded')).not.toBeInTheDocument();
  });

  it('keeps the error when a comment arrives in realtime before the first page loads', async () => {
    const { client } = await renderAnswerList({
      queryAnswers: () => Promise.reject(new Error('answers failed')),
    });
    await screen.findByText("Couldn't load the list");

    act(() => {
      client.dispatchEvent({ poll_vote: answer, type: 'poll.vote_casted' });
    });

    expect(screen.getByText("Couldn't load the list")).toBeInTheDocument();
    expect(screen.queryByText('Pizza, obviously')).not.toBeInTheDocument();
  });

  it('lists a comment that arrived in realtime once when the retried page contains it too', async () => {
    const queryAnswers = vi
      .fn<Poll['queryAnswers']>()
      .mockRejectedValueOnce(new Error('answers failed'))
      .mockImplementationOnce(() => answersPage([answer]));
    const { client } = await renderAnswerList({ queryAnswers });
    const retryButton = await screen.findByRole('button', { name: 'Try again' });
    act(() => {
      client.dispatchEvent({ poll_vote: answer, type: 'poll.vote_casted' });
    });

    fireEvent.click(retryButton);

    expect(await screen.findByText('Pizza, obviously')).toBeInTheDocument();
    expect(screen.getAllByText('Pizza, obviously')).toHaveLength(1);
  });

  it('renders the app ListLoadErrorUI when the first page fails', async () => {
    const ListLoadErrorUI = ({ error }: { error: Error }) => (
      <div data-testid='load-error'>{error.message}</div>
    );
    await renderAnswerList({
      overrides: { ListLoadErrorUI },
      queryAnswers: () => Promise.reject(new Error('answers failed')),
    });

    expect(await screen.findByTestId('load-error')).toHaveTextContent('answers failed');
  });

  it('renders the LoadingIndicator from ComponentContext while the next page loads', async () => {
    const CustomLoadingIndicator = () => <div data-testid='custom-loading-indicator' />;
    const queryAnswers = vi
      .fn<Poll['queryAnswers']>()
      .mockImplementationOnce(() => answersPage([answer], 'next-cursor'))
      .mockImplementationOnce(pending);
    const { container } = await renderAnswerList({
      overrides: { LoadingIndicator: CustomLoadingIndicator },
      queryAnswers,
    });

    await screen.findByText('Pizza, obviously');
    expect(screen.queryByTestId('custom-loading-indicator')).not.toBeInTheDocument();

    act(() => scrollToBottom(container));

    expect(await screen.findByTestId('custom-loading-indicator')).toBeInTheDocument();
    expect(
      container.querySelector(
        '.str-chat__loading-indicator-placeholder [data-testid="custom-loading-indicator"]',
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__loading-indicator'),
    ).not.toBeInTheDocument();
  });

  it('keeps the loaded answers without an error when a further page fails', async () => {
    const queryAnswers = vi
      .fn<Poll['queryAnswers']>()
      .mockImplementationOnce(() => answersPage([answer], 'next-cursor'))
      .mockRejectedValueOnce(new Error('next page failed'));
    const { container, queryAnswersSpy } = await renderAnswerList({ queryAnswers });

    await screen.findByText('Pizza, obviously');

    act(() => scrollToBottom(container));

    await vi.waitFor(() => expect(queryAnswersSpy).toHaveBeenCalledTimes(2));
    // Lets the failed query settle.
    await act(() => Promise.resolve());
    expect(screen.getByText('Pizza, obviously')).toBeInTheDocument();
    expect(screen.queryByText('next page failed')).not.toBeInTheDocument();
    expect(screen.queryByText("Couldn't load the list")).not.toBeInTheDocument();
  });

  it('shows the empty state when the poll has no comments', async () => {
    await renderAnswerList({ queryAnswers: () => answersPage([]) });

    const text = await screen.findByText('No comments yet');
    const emptyState = text.closest('.str-chat__poll-answer-list-empty');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the shared list-state overrides', async () => {
    const ListEmptyUI = () => <div data-testid='empty' />;

    await renderAnswerList({
      overrides: { ListEmptyUI },
      queryAnswers: () => answersPage([]),
    });

    expect(await screen.findByTestId('empty')).toBeInTheDocument();
    expect(screen.queryByText('No comments yet')).not.toBeInTheDocument();
  });
});

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Poll } from 'stream-chat';
import type { PollVoteResponseData } from 'stream-chat';

import { PollOptionWithVotesList } from '../PollResults/PollOptionWithVotesList';
import {
  ChatProvider,
  PollProvider,
  TranslationProvider,
  WithComponents,
} from '../../../../context';
import type { ComponentContextValue } from '../../../../context/ComponentContext';
import type { ListLoadingNextPageUIProps } from '../../../ListStates';
import {
  generatePoll,
  generateUser,
  getTestClientWithUser,
  mockChatContext,
  mockTranslationContextValue,
} from '../../../../mock-builders';
import { mockT } from '../../../../mock-builders/translator';

type QueryOptionVotesResult = Awaited<ReturnType<Poll['queryOptionVotes']>>;

const pollData = generatePoll();
const option = pollData.options[0];

const vote = {
  created_at: '2024-10-22T15:58:27.756166Z',
  id: 'vote-1',
  option_id: option.id,
  poll_id: pollData.id,
  updated_at: '2024-10-22T15:58:27.756166Z',
  user: { id: 'voter', name: 'Voting User' },
  user_id: 'voter',
} as unknown as PollVoteResponseData;

const votesPage = (
  votes: PollVoteResponseData[],
  next?: string,
): Promise<QueryOptionVotesResult> =>
  Promise.resolve({ duration: '', next, votes } as QueryOptionVotesResult);

const pending = () => new Promise<QueryOptionVotesResult>(() => undefined);

const renderVotesList = async ({
  overrides = {},
  queryOptionVotes,
}: {
  overrides?: Partial<ComponentContextValue>;
  queryOptionVotes: Poll['queryOptionVotes'];
}) => {
  const client = await getTestClientWithUser(generateUser());
  const poll = new Poll({ client, poll: pollData });
  const queryOptionVotesSpy = vi
    .spyOn(poll, 'queryOptionVotes')
    .mockImplementation(queryOptionVotes);

  const result = render(
    <ChatProvider value={mockChatContext({ client })}>
      <TranslationProvider value={mockTranslationContextValue({ t: mockT })}>
        <PollProvider poll={poll}>
          <WithComponents overrides={overrides}>
            <PollOptionWithVotesList option={option} optionOrderNumber={1} />
          </WithComponents>
        </PollProvider>
      </TranslationProvider>
    </ChatProvider>,
  );

  return { ...result, client, queryOptionVotesSpy };
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

describe('PollOptionWithVotesList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the loading state below the option header while the first page loads', async () => {
    const { container } = await renderVotesList({ queryOptionVotes: pending });

    expect(
      container.querySelector(
        '.str-chat__poll-option__votes-paginated-list .str-chat__loading-indicator-placeholder .str-chat__loading-indicator',
      ),
    ).toBeInTheDocument();
  });

  it('shows the ListLoadErrorUI below the option header when the first page fails', async () => {
    const { container } = await renderVotesList({
      queryOptionVotes: () => Promise.reject(new Error('votes failed')),
    });

    expect(await screen.findByText("Couldn't load the list")).toBeInTheDocument();
    expect(
      container.querySelector(
        '.str-chat__poll-option__votes-paginated-list .str-chat__list-load-error',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('votes failed')).not.toBeInTheDocument();
  });

  it('queries a failed first page again only on Try again, not on scrolling', async () => {
    const { container, queryOptionVotesSpy } = await renderVotesList({
      queryOptionVotes: () => Promise.reject(new Error('votes failed')),
    });
    await screen.findByText("Couldn't load the list");

    act(() => scrollToBottom(container));
    await act(() => Promise.resolve());

    expect(queryOptionVotesSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps the error when a vote arrives in realtime before the first page loads', async () => {
    const { client } = await renderVotesList({
      queryOptionVotes: () => Promise.reject(new Error('votes failed')),
    });
    await screen.findByText("Couldn't load the list");

    act(() => {
      client.dispatchEvent({ poll_vote: vote, type: 'poll.vote_casted' });
    });

    expect(screen.getByText("Couldn't load the list")).toBeInTheDocument();
    expect(screen.queryByText('Voting User')).not.toBeInTheDocument();
  });

  it('queries the first page again on Try again and shows the loaded votes', async () => {
    const queryOptionVotes = vi
      .fn<Poll['queryOptionVotes']>()
      .mockRejectedValueOnce(new Error('votes failed'))
      .mockImplementationOnce(() => votesPage([vote]));
    const { container, queryOptionVotesSpy } = await renderVotesList({
      queryOptionVotes,
    });

    const retryButton = await screen.findByRole('button', { name: 'Try again' });
    fireEvent.click(retryButton);

    await vi.waitFor(() =>
      expect(
        container.querySelector('.str-chat__list-load-error'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Voting User')).toBeInTheDocument();
    expect(queryOptionVotesSpy).toHaveBeenCalledTimes(2);
    expect(queryOptionVotesSpy.mock.calls[1][0]?.options?.next).toBeUndefined();
  });

  it('keeps the loaded votes without an error when a further page fails', async () => {
    const queryOptionVotes = vi
      .fn<Poll['queryOptionVotes']>()
      .mockImplementationOnce(() => votesPage([vote], 'next-cursor'))
      .mockRejectedValueOnce(new Error('next page failed'));
    const { container, queryOptionVotesSpy } = await renderVotesList({
      queryOptionVotes,
    });
    await screen.findByText('Voting User');

    act(() => scrollToBottom(container));

    await vi.waitFor(() => expect(queryOptionVotesSpy).toHaveBeenCalledTimes(2));
    await act(() => Promise.resolve());
    expect(screen.getByText('Voting User')).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load the list")).not.toBeInTheDocument();
  });

  it('renders the LoadingIndicator from ComponentContext while the next page loads', async () => {
    const CustomLoadingIndicator = () => <div data-testid='custom-loading-indicator' />;
    const queryOptionVotes = vi
      .fn<Poll['queryOptionVotes']>()
      .mockImplementationOnce(() => votesPage([vote], 'next-cursor'))
      .mockImplementationOnce(pending);
    const { container } = await renderVotesList({
      overrides: { LoadingIndicator: CustomLoadingIndicator },
      queryOptionVotes,
    });

    await screen.findByText('Voting User');
    expect(screen.queryByTestId('custom-loading-indicator')).not.toBeInTheDocument();

    act(() => scrollToBottom(container));

    expect(await screen.findByTestId('custom-loading-indicator')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__loading-indicator'),
    ).not.toBeInTheDocument();
  });

  it('renders ListLoadingNextPageUI over the LoadingIndicator while the next page loads', async () => {
    const CustomLoadingIndicator = () => <div data-testid='custom-loading-indicator' />;
    const ListLoadingNextPageUI = () => <div data-testid='next-page' />;
    const queryOptionVotes = vi
      .fn<Poll['queryOptionVotes']>()
      .mockImplementationOnce(() => votesPage([vote], 'next-cursor'))
      .mockImplementationOnce(pending);
    const { container } = await renderVotesList({
      overrides: {
        ListLoadingNextPageUI,
        LoadingIndicator: CustomLoadingIndicator,
      },
      queryOptionVotes,
    });

    await screen.findByText('Voting User');
    act(() => scrollToBottom(container));

    expect(await screen.findByTestId('next-page')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-loading-indicator')).not.toBeInTheDocument();
  });

  it('renders the shared ListLoadingNextPageUI', async () => {
    const ListLoadingNextPageUI = ({
      isLoading,
      position,
    }: ListLoadingNextPageUIProps) => (
      <div data-testid='next-page'>{`${position} ${isLoading}`}</div>
    );

    await renderVotesList({
      overrides: { ListLoadingNextPageUI },
      queryOptionVotes: () => votesPage([vote], 'next-cursor'),
    });

    expect(await screen.findByText('Voting User')).toBeInTheDocument();
    expect(screen.getByTestId('next-page')).toHaveTextContent('bottom false');
  });
});

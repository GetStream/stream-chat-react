import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { axe } from '../../../../axe-helper';

import {
  MessageReactionsDetail,
  type MessageReactionsDetailProps,
} from '../MessageReactionsDetail';
import { MessageProvider } from '../../../context/MessageContext';

import {
  generateReactions,
  generateUser,
  getTestClient,
  mockChatContext,
  mockMessageContext,
} from '../../../mock-builders';
import { ChatProvider, DialogManagerProvider, WithComponents } from '../../../context';
import type { ComponentContextValue } from '../../../context/ComponentContext';
import { defaultReactionOptions, type ReactionOptions } from '../reactionOptions';
import { useProcessReactions } from '../hooks/useProcessReactions';

import type { ReactionGroupResponse, ReactionResponse } from 'stream-chat';
import type { ReactionsComparator } from '../types';

const generateReactionsFromReactionGroups = (
  reactionGroups: Record<string, Pick<ReactionGroupResponse, 'count'>>,
) =>
  Object.entries(reactionGroups).flatMap(([type, { count }]) =>
    generateReactions(count, (i) => ({
      type,
      user: generateUser({ id: `mark-${i}`, name: `Mark Number ${i}` }),
    })),
  );

/**
 * Helper component that uses useProcessReactions to generate the
 * reactions summary needed by MessageReactionsDetail.
 */
const MessageReactionsDetailWrapper = ({
  handleFetchReactions,
  reaction_groups,
  reactions,
  sortReactions,
  ...rest
}: {
  handleFetchReactions?: MessageReactionsDetailProps['handleFetchReactions'];
  reaction_groups?: Record<string, Pick<ReactionGroupResponse, 'count'>>;
  reactions?: ReactionResponse[];
  sortReactions?: ReactionsComparator;
} & Partial<
  Omit<
    MessageReactionsDetailProps,
    'handleFetchReactions' | 'reactions' | 'totalReactionCount'
  >
>) => {
  const { existingReactions, totalReactionCount } = useProcessReactions({
    reaction_groups: reaction_groups as Record<string, ReactionGroupResponse>,
    reactions,
    sortReactions,
  });

  return (
    <MessageReactionsDetail
      handleFetchReactions={handleFetchReactions}
      reactions={existingReactions}
      selectedReactionType={
        rest.selectedReactionType ?? existingReactions[0]?.reactionType ?? null
      }
      totalReactionCount={totalReactionCount}
      {...rest}
    />
  );
};

const chatClient = getTestClient();

const renderComponent = ({
  handleFetchReactions,
  ...props
}: {
  handleFetchReactions?: MessageReactionsDetailProps['handleFetchReactions'];
} & Record<string, unknown>) =>
  render(
    <ChatProvider value={mockChatContext({ client: chatClient })}>
      <DialogManagerProvider>
        <WithComponents overrides={{ reactionOptions: defaultReactionOptions }}>
          <MessageProvider value={mockMessageContext()}>
            <MessageReactionsDetailWrapper
              handleFetchReactions={handleFetchReactions}
              {...props}
            />
          </MessageProvider>
        </WithComponents>
      </DialogManagerProvider>
    </ChatProvider>,
  );

describe('MessageReactionsDetail', () => {
  beforeEach(() => {
    // disable warnings (unreachable context)
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the reactions detail panel', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn((type: string) =>
      Promise.resolve(reactions.filter((r) => r.type === type)),
    );

    const { container, getByTestId } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
    });

    expect(getByTestId('message-reactions-detail')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display a list of reacted users', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn((type: string) =>
      Promise.resolve(reactions.filter((r) => r.type === type)),
    );

    const { getAllByTestId } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
      selectedReactionType: 'haha',
    });

    await waitFor(() => {
      expect(getAllByTestId('reaction-user-username')).toHaveLength(2);
    });
  });

  it('should switch to display users of different reaction type', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn((type: string) =>
      Promise.resolve(reactions.filter((r) => r.type === type)),
    );

    const { getAllByTestId, rerender } = render(
      <ChatProvider value={mockChatContext({ client: chatClient })}>
        <DialogManagerProvider>
          <WithComponents overrides={{ reactionOptions: defaultReactionOptions }}>
            <MessageProvider value={mockMessageContext()}>
              <MessageReactionsDetailWrapper
                handleFetchReactions={fetchReactions}
                reaction_groups={reactionGroups}
                reactions={reactions}
                selectedReactionType='haha'
              />
            </MessageProvider>
          </WithComponents>
        </DialogManagerProvider>
      </ChatProvider>,
    );

    await waitFor(() => {
      expect(getAllByTestId('reaction-user-username')).toHaveLength(2);
    });

    rerender(
      <ChatProvider value={mockChatContext({ client: chatClient })}>
        <DialogManagerProvider>
          <WithComponents overrides={{ reactionOptions: defaultReactionOptions }}>
            <MessageProvider value={mockMessageContext()}>
              <MessageReactionsDetailWrapper
                handleFetchReactions={fetchReactions}
                reaction_groups={reactionGroups}
                reactions={reactions}
                selectedReactionType='love'
              />
            </MessageProvider>
          </WithComponents>
        </DialogManagerProvider>
      </ChatProvider>,
    );

    await waitFor(() => {
      expect(getAllByTestId('reaction-user-username')).toHaveLength(5);
    });
  });

  it('should display total reaction count', () => {
    const reactionGroups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn(() => Promise.resolve([]));

    const { getByText } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
    });

    // total count is 7
    expect(getByText('{{ count }} reactions')).toBeInTheDocument();
  });

  it('should use custom reaction details comparator if provided', async () => {
    const reactionGroups = {
      haha: { count: 3 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups).reverse();
    const fetchReactions = vi.fn(() => Promise.resolve(reactions));

    const { getByText } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
      selectedReactionType: 'haha',
    });

    await waitFor(() => {
      expect(getByText('Mark Number 2')).toBeInTheDocument();
      expect(getByText('Mark Number 1')).toBeInTheDocument();
      expect(getByText('Mark Number 0')).toBeInTheDocument();
    });

    // Verify order: 2, 1, 0 (reverse alphabetical)
    await waitFor(() => {
      expect(
        getByText('Mark Number 2').compareDocumentPosition(getByText('Mark Number 1')),
      ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);

      expect(
        getByText('Mark Number 1').compareDocumentPosition(getByText('Mark Number 0')),
      ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });

  it('emits typed notification when fetching reactions fails', async () => {
    const reactionGroups = {
      haha: { count: 1 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchError = new Error('reactions failed');
    const fetchReactions = vi.fn(() => Promise.reject(fetchError));
    const addNotificationSpy = vi.spyOn(chatClient.notifications, 'add');

    renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
      selectedReactionType: 'haha',
    });

    await waitFor(() => {
      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error fetching reactions',
          options: expect.objectContaining({
            originalError: fetchError,
            severity: 'error',
            type: 'api:message:reactions:fetch:failed',
          }),
          origin: expect.objectContaining({ emitter: 'Reactions' }),
        }),
      );
    });
  });

  it('should always display reaction count for each reaction type', () => {
    const reactionGroups = {
      haha: { count: 1 },
      love: { count: 3 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn(() => Promise.resolve([]));

    const { getAllByTestId } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
    });

    const counts = getAllByTestId('reaction-type-count');
    expect(counts).toHaveLength(2);
    expect(counts[0]).toHaveTextContent('1');
    expect(counts[1]).toHaveTextContent('3');
  });

  it('should render add emoji button in the reaction type list', () => {
    const reactionGroups = {
      love: { count: 2 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn(() => Promise.resolve([]));

    const { getByTestId } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
    });

    expect(getByTestId('add-reaction-button')).toBeInTheDocument();
  });

  it('should show extended reaction list when add emoji button is clicked', () => {
    const reactionGroups = {
      love: { count: 2 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn(() => Promise.resolve([]));

    const extendedReactionOptions: ReactionOptions = {
      extended: {
        rocket: { Component: () => <>🚀</>, name: 'Rocket' },
        star: { Component: () => <>⭐</>, name: 'Star' },
      },
      quick: {
        love: { Component: () => <>❤️</>, name: 'Heart' },
      },
    };

    const { getByTestId, queryByTestId } = render(
      <ChatProvider value={mockChatContext({ client: chatClient })}>
        <DialogManagerProvider>
          <WithComponents overrides={{ reactionOptions: extendedReactionOptions }}>
            <MessageProvider
              value={mockMessageContext({ message: { id: 'test-detail-msg' } })}
            >
              <MessageReactionsDetailWrapper
                handleFetchReactions={fetchReactions}
                reaction_groups={reactionGroups}
                reactions={reactions}
              />
            </MessageProvider>
          </WithComponents>
        </DialogManagerProvider>
      </ChatProvider>,
    );

    fireEvent.click(getByTestId('add-reaction-button'));

    // Extended list should be visible
    expect(getByTestId('reaction-selector-extended-list')).toBeInTheDocument();

    // The detail panel should still be present
    expect(getByTestId('message-reactions-detail')).toBeInTheDocument();

    // The reaction type list should NOT be visible
    expect(queryByTestId('reaction-type-list')).not.toBeInTheDocument();
  });

  it('should use custom ReactionSelectorExtendedList from ComponentContext', () => {
    const reactionGroups = {
      love: { count: 2 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn(() => Promise.resolve([]));

    const CustomExtendedList = vi.fn(() => (
      <div data-testid='custom-extended-list'>Custom</div>
    ));

    const overrides: Partial<ComponentContextValue> = {
      reactionOptions: {
        extended: {
          rocket: { Component: () => <>🚀</>, name: 'Rocket' },
        },
        quick: {
          love: { Component: () => <>❤️</>, name: 'Heart' },
        },
      },
      ReactionSelectorExtendedList: CustomExtendedList,
    };

    const { getByTestId } = render(
      <ChatProvider value={mockChatContext({ client: chatClient })}>
        <DialogManagerProvider>
          <WithComponents overrides={overrides}>
            <MessageProvider
              value={mockMessageContext({ message: { id: 'test-detail-msg' } })}
            >
              <MessageReactionsDetailWrapper
                handleFetchReactions={fetchReactions}
                reaction_groups={reactionGroups}
                reactions={reactions}
              />
            </MessageProvider>
          </WithComponents>
        </DialogManagerProvider>
      </ChatProvider>,
    );

    fireEvent.click(getByTestId('add-reaction-button'));

    expect(getByTestId('custom-extended-list')).toBeInTheDocument();
    expect(CustomExtendedList).toHaveBeenCalled();
  });
});

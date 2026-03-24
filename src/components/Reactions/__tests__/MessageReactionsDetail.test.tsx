import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { axe } from '../../../../axe-helper';

import { MessageReactionsDetail } from '../MessageReactionsDetail';
import { MessageProvider } from '../../../context/MessageContext';

import { generateReactions, generateUser } from '../../../mock-builders';
import { ChatProvider, ComponentProvider, DialogManagerProvider } from '../../../context';
import { defaultReactionOptions } from '../reactionOptions';
import { useProcessReactions } from '../hooks/useProcessReactions';
import { getTestClient } from '../../../mock-builders';

const generateReactionsFromReactionGroups = (reactionGroups: any) =>
  Object.entries(reactionGroups).flatMap(([type, { count }]: any) =>
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
  sortReactionDetails,
  sortReactions,
  ...rest
}: any) => {
  const { existingReactions, totalReactionCount } = useProcessReactions({
    reaction_groups,
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
      sortReactionDetails={sortReactionDetails}
      totalReactionCount={totalReactionCount}
      {...rest}
    />
  );
};

const chatClient = getTestClient();

const renderComponent = ({ handleFetchReactions, ...props }: any) =>
  render(
    <ChatProvider value={{ client: chatClient } as any}>
      <DialogManagerProvider>
        <ComponentProvider value={{ reactionOptions: defaultReactionOptions } as any}>
          <MessageProvider value={{} as any}>
            <MessageReactionsDetailWrapper
              handleFetchReactions={handleFetchReactions}
              {...props}
            />
          </MessageProvider>
        </ComponentProvider>
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
    const fetchReactions = vi.fn((type) =>
      Promise.resolve(reactions.filter((r) => r.type === type)),
    );

    const { container, getByTestId } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
    });

    expect(getByTestId('reactions-list-modal')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display a list of reacted users', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = vi.fn((type) =>
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
    const fetchReactions = vi.fn((type) =>
      Promise.resolve(reactions.filter((r) => r.type === type)),
    );

    const { getAllByTestId, rerender } = render(
      <ChatProvider value={{ client: chatClient } as any}>
        <DialogManagerProvider>
          <ComponentProvider value={{ reactionOptions: defaultReactionOptions } as any}>
            <MessageProvider value={{} as any}>
              <MessageReactionsDetailWrapper
                handleFetchReactions={fetchReactions}
                reaction_groups={reactionGroups}
                reactions={reactions}
                selectedReactionType='haha'
              />
            </MessageProvider>
          </ComponentProvider>
        </DialogManagerProvider>
      </ChatProvider>,
    );

    await waitFor(() => {
      expect(getAllByTestId('reaction-user-username')).toHaveLength(2);
    });

    rerender(
      <ChatProvider value={{ client: chatClient } as any}>
        <DialogManagerProvider>
          <ComponentProvider value={{ reactionOptions: defaultReactionOptions } as any}>
            <MessageProvider value={{} as any}>
              <MessageReactionsDetailWrapper
                handleFetchReactions={fetchReactions}
                reaction_groups={reactionGroups}
                reactions={reactions}
                selectedReactionType='love'
              />
            </MessageProvider>
          </ComponentProvider>
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
      sortReactionDetails: (a, b) => -a.user.name.localeCompare(b.user.name),
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
});

import React from 'react';
import { render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { axe } from '../../../../axe-helper';

import { MessageReactions, type MessageReactionsProps } from '../MessageReactions';
import { MessageProvider } from '../../../context/MessageContext';

import { generateReaction, mockMessageContext } from '../../../mock-builders';
import { DialogManagerProvider, WithComponents } from '../../../context';
import { defaultReactionOptions, type ReactionOptions } from '../reactionOptions';

import type { ReactionGroupResponse } from 'stream-chat';
import type { ReactionsComparator } from '../types';

const USER_ID = 'mark';

const renderComponent = ({
  reaction_groups = {},
  reactionOptions = defaultReactionOptions,
  ...props
}: {
  reaction_groups?: Record<string, ReactionGroupResponse>;
  reactionOptions?: ReactionOptions;
  sortReactions?: ReactionsComparator;
} & Partial<Omit<MessageReactionsProps, 'reaction_groups' | 'reactions'>> = {}) => {
  const reactions = Object.entries(reaction_groups).flatMap(([type, { count }]) =>
    Array.from({ length: count }, (_, i) =>
      generateReaction({ type, user: { id: `${USER_ID}-${i}` } }),
    ),
  );

  return render(
    <DialogManagerProvider>
      <WithComponents overrides={{ reactionOptions }}>
        <MessageProvider
          value={mockMessageContext({
            isMyMessage: () => false,
            message: { id: 'test-msg' },
          })}
        >
          <MessageReactions
            reaction_groups={reaction_groups}
            reactions={reactions}
            {...props}
          />
        </MessageProvider>
      </WithComponents>
    </DialogManagerProvider>,
  );
};

describe('MessageReactions', () => {
  afterEach(vi.clearAllMocks);

  // disable warnings (unreachable context)
  vi.spyOn(console, 'warn').mockImplementation(null);

  it('should render the total reaction count in clustered mode', async () => {
    const { container, getByTestId } = renderComponent({
      reaction_groups: {
        haha: fromPartial<ReactionGroupResponse>({ count: 2 }),
        love: fromPartial<ReactionGroupResponse>({ count: 5 }),
      },
    });
    const countEl = getByTestId('message-reactions-total-count');
    expect(countEl).toBeInTheDocument();
    expect(countEl).toHaveTextContent('7');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not break when reaction groups are not defined', async () => {
    const { container } = renderComponent({
      reaction_groups: undefined,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render an emoji for each type of reaction', async () => {
    const { container, getAllByTestId } = renderComponent({
      reaction_groups: {
        haha: fromPartial<ReactionGroupResponse>({ count: 2 }),
        love: fromPartial<ReactionGroupResponse>({ count: 5 }),
      },
    });

    const listItems = getAllByTestId('message-reactions-list-item');
    expect(listItems).toHaveLength(2);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle custom reaction options', async () => {
    const { container, getAllByTestId } = renderComponent({
      reaction_groups: {
        banana: fromPartial<ReactionGroupResponse>({ count: 1 }),
        cowboy: fromPartial<ReactionGroupResponse>({ count: 2 }),
      },
      reactionOptions: [
        { Component: () => <>🍌</>, type: 'banana' },
        { Component: () => <>🤠</>, type: 'cowboy' },
      ],
    });

    const listItems = getAllByTestId('message-reactions-list-item');
    expect(listItems).toHaveLength(2);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should order reactions by first reaction timestamp by default', () => {
    const { getAllByTestId } = renderComponent({
      reaction_groups: {
        haha: fromPartial<ReactionGroupResponse>({
          count: 2,
          first_reaction_at: new Date().toISOString(),
        }),
        like: fromPartial<ReactionGroupResponse>({
          count: 8,
          first_reaction_at: new Date(Date.now() + 60_000).toISOString(),
        }),
        love: fromPartial<ReactionGroupResponse>({
          count: 5,
          first_reaction_at: new Date(Date.now() + 120_000).toISOString(),
        }),
      },
    });

    const icons = getAllByTestId('message-reactions-list-item-icon').map(
      (el) => el.textContent,
    );

    // haha (😂) should come first, then like (👍), then love (❤️)
    expect(icons[0]).toBe('😂');
    expect(icons[1]).toBe('👍');
    expect(icons[2]).toContain('❤');
  });

  it('should use custom comparator if provided', () => {
    const { getAllByTestId } = renderComponent({
      reaction_groups: {
        haha: fromPartial<ReactionGroupResponse>({ count: 2 }),
        like: fromPartial<ReactionGroupResponse>({ count: 8 }),
        love: fromPartial<ReactionGroupResponse>({ count: 5 }),
      },
      sortReactions: (a, b) => b.reactionCount - a.reactionCount,
    });

    const icons = getAllByTestId('message-reactions-list-item-icon').map(
      (el) => el.textContent,
    );

    // like (8) > love (5) > haha (2)
    expect(icons[0]).toBe('👍');
    expect(icons[1]).toContain('❤');
    expect(icons[2]).toBe('😂');
  });
});

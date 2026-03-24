// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react';

import { axe } from '../../../../axe-helper';

import { MessageReactions } from '../MessageReactions';
import { MessageProvider } from '../../../context/MessageContext';

import { generateReaction } from '../../../mock-builders';
import { ComponentProvider, DialogManagerProvider } from '../../../context';
import { defaultReactionOptions } from '../reactionOptions';

const USER_ID = 'mark';

const renderComponent = ({ reaction_groups = {}, ...props } = {}) => {
  const reactions = Object.entries(reaction_groups).flatMap(([type, { count }]) =>
    Array.from({ length: count }, (_, i) =>
      generateReaction({ type, user: { id: `${USER_ID}-${i}` } }),
    ),
  );

  return render(
    <DialogManagerProvider>
      <ComponentProvider value={{ reactionOptions: defaultReactionOptions }}>
        <MessageProvider
          value={{ isMyMessage: () => false, message: { id: 'test-msg' } }}
        >
          <MessageReactions
            reaction_groups={reaction_groups}
            reactions={reactions}
            {...props}
          />
        </MessageProvider>
      </ComponentProvider>
    </DialogManagerProvider>,
  );
};

describe('MessageReactions', () => {
  afterEach(vi.clearAllMocks);

  // disable warnings (unreachable context)
  vi.spyOn(console, 'warn').mockImplementation(null);

  it('should render the total reaction count in clustered mode', async () => {
    const { container } = renderComponent({
      reaction_groups: {
        haha: { count: 2 },
        love: { count: 5 },
      },
    });
    const countEl = container.querySelector('.str-chat__message-reactions__total-count');
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
    const reaction_groups = {
      haha: { count: 2 },
      love: { count: 5 },
    };

    const { container } = renderComponent({ reaction_groups });

    const listItems = container.querySelectorAll(
      '.str-chat__message-reactions__list-item',
    );
    expect(listItems).toHaveLength(2);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle custom reaction options', async () => {
    const reaction_groups = {
      banana: { count: 1 },
      cowboy: { count: 2 },
    };

    const { container } = renderComponent({
      reaction_groups,
      reactionOptions: [
        { Component: () => <>🍌</>, type: 'banana' },
        { Component: () => <>🤠</>, type: 'cowboy' },
      ],
    });

    const listItems = container.querySelectorAll(
      '.str-chat__message-reactions__list-item',
    );
    expect(listItems).toHaveLength(2);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should order reactions by first reaction timestamp by default', () => {
    const { container } = renderComponent({
      reaction_groups: {
        haha: { count: 2, first_reaction_at: new Date().toISOString() },
        like: {
          count: 8,
          first_reaction_at: new Date(Date.now() + 60_000).toISOString(),
        },
        love: {
          count: 5,
          first_reaction_at: new Date(Date.now() + 120_000).toISOString(),
        },
      },
    });

    const listItems = container.querySelectorAll(
      '.str-chat__message-reactions__list-item',
    );
    const icons = Array.from(listItems).map(
      (item) =>
        item.querySelector('.str-chat__message-reactions__list-item-icon')?.textContent,
    );

    // haha (😂) should come first, then like (👍), then love (❤️)
    expect(icons[0]).toBe('😂');
    expect(icons[1]).toBe('👍');
    expect(icons[2]).toContain('❤');
  });

  it('should use custom comparator if provided', () => {
    const { container } = renderComponent({
      reaction_groups: {
        haha: { count: 2 },
        like: { count: 8 },
        love: { count: 5 },
      },
      sortReactions: (a, b) => b.reactionCount - a.reactionCount,
    });

    const listItems = container.querySelectorAll(
      '.str-chat__message-reactions__list-item',
    );
    const icons = Array.from(listItems).map(
      (item) =>
        item.querySelector('.str-chat__message-reactions__list-item-icon')?.textContent,
    );

    // like (8) > love (5) > haha (2)
    expect(icons[0]).toBe('👍');
    expect(icons[1]).toContain('❤');
    expect(icons[2]).toBe('😂');
  });
});

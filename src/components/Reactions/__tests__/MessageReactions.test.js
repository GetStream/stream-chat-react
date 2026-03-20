import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { ReactionsList } from '../ReactionsList';
import * as utils from '../utils/utils';
import { MessageProvider } from '../../../context/MessageContext';

import { generateReaction } from '../../../mock-builders';
import { ComponentProvider } from '../../../context';
import { defaultReactionOptions } from '../reactionOptions';

const USER_ID = 'mark';

const renderComponent = ({
  reaction_groups = {},
  ReactionsListModal = undefined,
  ...props
}) => {
  const reactions = Object.entries(reaction_groups).flatMap(([type, { count }]) =>
    Array.from({ length: count }, (_, i) =>
      generateReaction({ type, user: { id: `${USER_ID}-${i}` } }),
    ),
  );

  return render(
    <ComponentProvider
      value={{ reactionOptions: defaultReactionOptions, ReactionsListModal }}
    >
      <MessageProvider value={{}}>
        <ReactionsList
          reaction_groups={reaction_groups}
          reactions={reactions}
          {...props}
        />
        ,
      </MessageProvider>
    </ComponentProvider>,
  );
};

describe('ReactionsList', () => {
  afterEach(jest.clearAllMocks);

  // disable warnings (unreachable context)
  jest.spyOn(console, 'warn').mockImplementation(null);

  it('renders custom ReactionsListModal', async () => {
    const CUSTOM_MODAL_TEST_ID = 'custom-reaction-list-modal';
    const ReactionsListModal = () => <div data-testid={CUSTOM_MODAL_TEST_ID} />;
    renderComponent({
      reaction_groups: {
        haha: { count: 2 },
        love: { count: 5 },
      },
      ReactionsListModal,
    });

    await act(() => {
      fireEvent.click(screen.getByTestId('reactions-list-button-haha'));
    });
    expect(screen.getByTestId(CUSTOM_MODAL_TEST_ID)).toBeInTheDocument();
  });

  it('should render the total reaction count', async () => {
    const { container, getByText } = renderComponent({
      reaction_groups: {
        haha: { count: 2 },
        love: { count: 5 },
      },
    });
    const count = getByText('7');
    expect(count).toBeInTheDocument();
    expect(count).toHaveClass('str-chat__reaction-list--counter');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not break when reaction counts are not defined', async () => {
    const { container } = renderComponent({
      reaction_counts: undefined,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render an emoji for each type of reaction', async () => {
    const reaction_groups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    // make sure to render default fallbacks
    jest.spyOn(utils, 'getImageDimensions').mockRejectedValue('Error');
    jest.spyOn(console, 'error').mockImplementation(null);

    const { container, getByTestId } = renderComponent({ reaction_groups });

    const hahaButton = getByTestId('reactions-list-button-haha');
    const loveButton = getByTestId('reactions-list-button-love');

    expect(hahaButton.lastChild).toHaveTextContent(reaction_groups['haha'].count);
    expect(hahaButton.firstChild).toHaveTextContent('😂');

    expect(loveButton.lastChild).toHaveTextContent(reaction_groups['love'].count);
    expect(loveButton.firstChild).toHaveTextContent('❤️');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle custom reaction options', async () => {
    const reaction_groups = {
      banana: { count: 1 },
      cowboy: { count: 2 },
    };

    const { container, getByTestId } = renderComponent({
      reaction_groups,
      reactionOptions: [
        { Component: () => <>🍌</>, type: 'banana' },
        { Component: () => <>🤠</>, type: 'cowboy' },
      ],
    });

    const bananaButton = getByTestId('reactions-list-button-banana');
    const cowboyButton = getByTestId('reactions-list-button-cowboy');

    expect(bananaButton.lastChild).toHaveTextContent(reaction_groups['banana'].count);
    expect(bananaButton.firstChild).toHaveTextContent('🍌');

    expect(cowboyButton.lastChild).toHaveTextContent(reaction_groups['cowboy'].count);
    expect(cowboyButton.firstChild).toHaveTextContent('🤠');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should add reverse class if the prop is set to true', () => {
    const reaction_groups = {
      banana: { count: 1 },
      cowboy: { count: 2 },
    };
    const reactionOptions = [
      { Component: () => <>🍌</>, type: 'banana' },
      { Component: () => <>🤠</>, type: 'cowboy' },
    ];

    expect(
      renderComponent({
        reaction_groups,
        reactionOptions,
        reverse: true,
      }).container.querySelector('.str-chat__reaction-list--reverse'),
    ).toBeInTheDocument();

    expect(
      renderComponent({
        reaction_groups,
        reactionOptions,
        reverse: false,
      }).container.querySelector('.str-chat__reaction-list--reverse'),
    ).not.toBeInTheDocument();
  });

  it('should order reactions by first reaction timestamp by default', () => {
    const { getByTestId } = renderComponent({
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

    expect(
      getByTestId('reactions-list-button-haha').compareDocumentPosition(
        getByTestId('reactions-list-button-like'),
      ),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(
      getByTestId('reactions-list-button-like').compareDocumentPosition(
        getByTestId('reactions-list-button-love'),
      ),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('should use custom comparator if provided', () => {
    const { getByTestId } = renderComponent({
      reaction_groups: {
        haha: { count: 2 },
        like: { count: 8 },
        love: { count: 5 },
      },
      sortReactions: (a, b) => b.reactionCount - a.reactionCount,
    });

    expect(
      getByTestId('reactions-list-button-like').compareDocumentPosition(
        getByTestId('reactions-list-button-love'),
      ),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(
      getByTestId('reactions-list-button-love').compareDocumentPosition(
        getByTestId('reactions-list-button-haha'),
      ),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});

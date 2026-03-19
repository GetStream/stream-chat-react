import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { ReactionsList } from '../ReactionsList';
import { MessageProvider } from '../../../context/MessageContext';

import { generateReactions, generateUser } from '../../../mock-builders';
import { ComponentProvider } from '../../../context';
import { defaultReactionOptions } from '../reactionOptions';

const generateReactionsFromReactionGroups = (reactionGroups) =>
  Object.entries(reactionGroups).flatMap(([type, { count }]) =>
    generateReactions(count, (i) => ({
      type,
      user: generateUser({ id: `mark-${i}`, name: `Mark Number ${i}` }),
    })),
  );

const renderComponent = ({ handleFetchReactions, ...props }) =>
  render(
    <ComponentProvider value={{ reactionOptions: defaultReactionOptions }}>
      <MessageProvider value={{}}>
        <ReactionsList handleFetchReactions={handleFetchReactions} {...props} />,
      </MessageProvider>
    </ComponentProvider>,
  );

describe('ReactionsListModal', () => {
  beforeEach(() => {
    // disable warnings (unreachable context)
    jest.spyOn(console, 'warn').mockImplementation(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show reactions modal when a reaction is clicked', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    const { container, getByTestId, queryByTestId } = renderComponent({
      reaction_groups: reactionGroups,
      reactions: generateReactionsFromReactionGroups(reactionGroups),
    });

    expect(queryByTestId('reactions-list-modal')).not.toBeInTheDocument();
    await act(() => {
      fireEvent.click(getByTestId('reactions-list-button-haha'));
    });

    expect(getByTestId('reactions-list-modal')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display a list of reactions in a modal', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups);
    const fetchReactions = jest.fn((type) =>
      Promise.resolve(reactions.filter((r) => r.type === type)),
    );

    const { container, getAllByTestId, getByTestId } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
    });

    await act(() => {
      fireEvent.click(getByTestId('reactions-list-button-haha'));
    });
    expect(getAllByTestId('reaction-user-username')).toHaveLength(2);

    await act(() => {
      fireEvent.click(getByTestId('reaction-details-selector-love'));
    });
    expect(getAllByTestId('reaction-user-username')).toHaveLength(5);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should close reactions list modal when close button is clicked', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    const { getByTestId, getByTitle, queryByTestId } = renderComponent({
      reaction_groups: reactionGroups,
      reactions: generateReactionsFromReactionGroups(reactionGroups),
    });

    await act(() => {
      fireEvent.click(getByTestId('reactions-list-button-haha'));
    });
    expect(getByTestId('reactions-list-modal')).toBeInTheDocument();
    await act(() => {
      fireEvent.click(getByTitle('Close'));
    });
    expect(queryByTestId('reactions-list-modal')).not.toBeInTheDocument();
  });

  it('should not allow opening reactions list modal when the reactions count is too high', async () => {
    const reactionGroups = {
      haha: { count: 2000 },
      love: { count: 5000 },
    };
    const { getByTestId, queryByTestId } = renderComponent({
      reaction_groups: reactionGroups,
      reactions: generateReactionsFromReactionGroups(reactionGroups),
    });

    await act(() => {
      fireEvent.click(getByTestId('reactions-list-button-haha'));
    });
    expect(queryByTestId('reactions-list-modal')).not.toBeInTheDocument();
  });

  it('should order reactions alphabetically by default', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      like: { count: 8 },
      love: { count: 5 },
    };
    const { getByTestId } = renderComponent({
      reaction_groups: reactionGroups,
      reactions: generateReactionsFromReactionGroups(reactionGroups),
    });

    await act(() => {
      fireEvent.click(getByTestId('reactions-list-button-haha'));
    });

    expect(
      getByTestId('reaction-details-selector-haha').compareDocumentPosition(
        getByTestId('reaction-details-selector-like'),
      ),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(
      getByTestId('reaction-details-selector-like').compareDocumentPosition(
        getByTestId('reaction-details-selector-love'),
      ),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('should use custom reactions comparator if provided', async () => {
    const reactionGroups = {
      haha: { count: 2 },
      like: { count: 8 },
      love: { count: 5 },
    };
    const { getByTestId } = renderComponent({
      reaction_groups: reactionGroups,
      reactions: generateReactionsFromReactionGroups(reactionGroups),
      sortReactions: (a, b) => b.reactionCount - a.reactionCount,
    });

    await act(() => {
      fireEvent.click(getByTestId('reactions-list-button-haha'));
    });

    expect(
      getByTestId('reaction-details-selector-like').compareDocumentPosition(
        getByTestId('reaction-details-selector-love'),
      ),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(
      getByTestId('reaction-details-selector-love').compareDocumentPosition(
        getByTestId('reaction-details-selector-haha'),
      ),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('should use custom reaction details comparator if provided', async () => {
    const reactionGroups = {
      haha: { count: 3 },
    };
    const reactions = generateReactionsFromReactionGroups(reactionGroups).reverse();
    const fetchReactions = jest.fn(() => Promise.resolve(reactions));
    const { getByTestId, getByText } = renderComponent({
      handleFetchReactions: fetchReactions,
      reaction_groups: reactionGroups,
      reactions,
      sortReactionDetails: (a, b) => -a.user.name.localeCompare(b.user.name),
    });

    await act(() => {
      fireEvent.click(getByTestId('reactions-list-button-haha'));
    });

    expect(
      getByText('Mark Number 2').compareDocumentPosition(getByText('Mark Number 1')),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(
      getByText('Mark Number 1').compareDocumentPosition(getByText('Mark Number 0')),
    ).toStrictEqual(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});

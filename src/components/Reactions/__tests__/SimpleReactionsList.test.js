import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { generateReaction } from 'mock-builders';
import { NimbleEmoji as EmojiComponentMock } from 'emoji-mart';
import SimpleReactionsList from '../SimpleReactionsList';

jest.mock('emoji-mart', () => ({
  NimbleEmoji: jest.fn(({ emoji }) => (
    <div data-testid={`emoji-${emoji.id}`} />
  )),
}));

const handleReactionMock = jest.fn();
const loveEmojiTestId = 'emoji-love';

const renderComponent = ({ reaction_counts = {}, ...props }) => {
  const reactions = Object.entries(reaction_counts)
    .map(([type, count]) =>
      Array(count)
        .fill()
        .map(() => generateReaction({ type })),
    )
    .flat();

  return {
    ...render(
      <SimpleReactionsList
        reaction_counts={reaction_counts}
        reactions={reactions}
        handleReaction={handleReactionMock}
        {...props}
      />,
    ),
    reactions,
  };
};

const expectEmojiToHaveBeenRendered = (id) => {
  expect(EmojiComponentMock).toHaveBeenCalledWith(
    expect.objectContaining({
      emoji: expect.objectContaining({ id }),
    }),
    {},
  );
};

describe('SimpleReactionsList', () => {
  afterEach(jest.clearAllMocks);

  it('should not render anything if there are no reactions', () => {
    const { container } = renderComponent({
      reaction_counts: {},
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('should render the total reaction count', () => {
    const { getByText } = renderComponent({
      reaction_counts: {
        love: 5,
        angry: 2,
      },
    });
    const count = getByText('7');
    expect(count).toBeInTheDocument();
    expect(count).toHaveClass(
      'str-chat__simple-reactions-list-item--last-number',
    );
  });

  it('should render an emoji for each type of reaction', () => {
    const reaction_counts = {
      love: 5,
      angry: 2,
    };
    renderComponent({ reaction_counts });

    expect(EmojiComponentMock).toHaveBeenCalledTimes(
      Object.keys(reaction_counts).length,
    );

    Object.keys(reaction_counts).forEach(expectEmojiToHaveBeenRendered);
  });

  it('should handle custom reaction options', () => {
    const reaction_counts = {
      banana: 1,
      cowboy: 2,
    };

    renderComponent({
      reaction_counts,
      reactionOptions: [
        { id: 'banana', emoji: '🍌' },
        { id: 'cowboy', emoji: '🤠' },
      ],
    });

    expect(EmojiComponentMock).toHaveBeenCalledTimes(
      Object.keys(reaction_counts).length,
    );

    Object.keys(reaction_counts).forEach(expectEmojiToHaveBeenRendered);
  });

  it('should call handleReaction callback if a reaction emoji is clicked', () => {
    const reaction_counts = {
      love: 1,
    };

    const { getByTestId } = renderComponent({ reaction_counts });

    fireEvent.click(getByTestId(loveEmojiTestId));

    expect(handleReactionMock).toHaveBeenCalledWith('love');
  });

  it('should render a tooltip with all users that reacted a certain way if the emoji is hovered', () => {
    const reaction_counts = {
      love: 3,
    };

    const { reactions, getByTestId, queryByText } = renderComponent({
      reaction_counts,
    });

    fireEvent.mouseEnter(getByTestId(loveEmojiTestId));

    reactions.forEach(({ user }) => {
      expect(
        queryByText(user.name || user.id, { exact: false }),
      ).toBeInTheDocument();
    });

    fireEvent.mouseLeave(getByTestId(loveEmojiTestId));

    reactions.forEach(({ user }) => {
      expect(queryByText(user.id, { exact: false })).not.toBeInTheDocument();
    });
  });
});

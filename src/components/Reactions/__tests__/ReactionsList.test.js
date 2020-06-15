import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { generateReaction } from 'mock-builders';
import { NimbleEmoji as EmojiComponentMock } from 'emoji-mart';
import ReactionsList from '../ReactionsList';

jest.mock('emoji-mart', () => ({
  NimbleEmoji: jest.fn(({ emoji }) => (
    <div data-testid={`emoji-${emoji.id}`} />
  )),
}));

const renderComponent = ({ reaction_counts = {}, ...props }) => {
  const reactions = Object.entries(reaction_counts)
    .map(([type, count]) =>
      Array(count)
        .fill()
        .map(() => generateReaction({ type })),
    )
    .flat();

  return render(
    <ReactionsList
      reaction_counts={reaction_counts}
      reactions={reactions}
      {...props}
    />,
  );
};

const expectEmojiToHaveBeenRendered = (id) => {
  expect(EmojiComponentMock).toHaveBeenCalledWith(
    expect.objectContaining({
      emoji: expect.objectContaining({ id }),
    }),
    {},
  );
};

describe('ReactionsList', () => {
  afterEach(jest.clearAllMocks);

  it('should render the total reaction count', () => {
    const { getByText } = renderComponent({
      reaction_counts: {
        love: 5,
        angry: 2,
      },
    });
    const count = getByText('7');
    expect(count).toBeInTheDocument();
    expect(count).toHaveClass('str-chat__reaction-list--counter');
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

  it('should add reverse class if the prop is set to true', () => {
    expect(
      renderComponent({ reverse: true }).container.querySelector(
        '.str-chat__reaction-list--reverse',
      ),
    ).toBeInTheDocument();
    expect(
      renderComponent({ reverse: false }).container.querySelector(
        '.str-chat__reaction-list--reverse',
      ),
    ).not.toBeInTheDocument();
  });
});

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmojiComponentMock from 'emoji-mart/dist-modern/components/emoji/nimble-emoji';

import { SimpleReactionsList } from '../SimpleReactionsList';

import { EmojiProvider } from '../../../context/EmojiContext';
import { emojiComponentMock, emojiDataMock, generateReaction } from '../../../mock-builders';

jest.mock('emoji-mart/dist-modern/components/emoji/nimble-emoji', () =>
  jest.fn(({ emoji }) => <div data-testid={`emoji-${emoji.id}`} />),
);

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
      <EmojiProvider
        value={{
          Emoji: emojiComponentMock.Emoji,
          emojiConfig: emojiDataMock,
          EmojiIndex: emojiComponentMock.EmojiIndex,
          EmojiPicker: emojiComponentMock.EmojiPicker,
        }}
      >
        <SimpleReactionsList
          handleReaction={handleReactionMock}
          reaction_counts={reaction_counts}
          reactions={reactions}
          {...props}
        />
      </EmojiProvider>,
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
        angry: 2,
        love: 5,
      },
    });
    const count = getByText('7');
    expect(count).toBeInTheDocument();
    expect(count).toHaveClass('str-chat__simple-reactions-list-item--last-number');
  });

  it('should render an emoji for each type of reaction', () => {
    const reaction_counts = {
      angry: 2,
      love: 5,
    };
    renderComponent({ reaction_counts });

    expect(EmojiComponentMock).toHaveBeenCalledTimes(Object.keys(reaction_counts).length);

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
        { emoji: '🍌', id: 'banana' },
        { emoji: '🤠', id: 'cowboy' },
      ],
    });

    expect(EmojiComponentMock).toHaveBeenCalledTimes(Object.keys(reaction_counts).length);

    Object.keys(reaction_counts).forEach(expectEmojiToHaveBeenRendered);
  });

  it('should call handleReaction callback if a reaction emoji is clicked', () => {
    const reaction_counts = {
      love: 1,
    };

    const { getByTestId } = renderComponent({ reaction_counts });

    fireEvent.click(getByTestId(loveEmojiTestId));

    expect(handleReactionMock).toHaveBeenCalledWith('love', expect.any(Object));
  });

  it('should render a tooltip with all users that reacted a certain way if the emoji is hovered', () => {
    const reaction_counts = {
      love: 3,
    };

    const { getByTestId, queryByText, reactions } = renderComponent({
      reaction_counts,
    });

    fireEvent.mouseEnter(getByTestId(loveEmojiTestId));

    reactions.forEach(({ user }) => {
      expect(queryByText(user.name || user.id, { exact: false })).toBeInTheDocument();
    });

    fireEvent.mouseLeave(getByTestId(loveEmojiTestId));

    reactions.forEach(({ user }) => {
      expect(queryByText(user.id, { exact: false })).not.toBeInTheDocument();
    });
  });
});

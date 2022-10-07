import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmojiComponentMock from 'emoji-mart/dist-modern/components/emoji/nimble-emoji';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { SimpleReactionsList } from '../SimpleReactionsList';

import { ChatProvider } from '../../../context/ChatContext';
import { EmojiProvider } from '../../../context/EmojiContext';
import { MessageProvider } from '../../../context/MessageContext';

import { emojiComponentMock, emojiDataMock, generateReaction } from '../../../mock-builders';

jest.mock('emoji-mart/dist-modern/components/emoji/nimble-emoji', () =>
  jest.fn(({ emoji }) => <div data-testid={`emoji-${emoji.id}`} />),
);

const handleReactionMock = jest.fn();
const loveEmojiTestId = 'emoji-love';

const renderComponent = ({ reaction_counts = {}, themeVersion = '1', ...props }) => {
  const reactions = Object.entries(reaction_counts)
    .map(([type, count]) =>
      Array(count)
        .fill()
        .map(() => generateReaction({ type })),
    )
    .flat();

  return {
    ...render(
      <ChatProvider value={{ themeVersion }}>
        <MessageProvider value={{}}>
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
          </EmojiProvider>
        </MessageProvider>
      </ChatProvider>,
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

describe.each(['1', '2'])('SimpleReactionsList v%s', (themeVersion) => {
  afterEach(jest.clearAllMocks);

  it('should not render anything if there are no reactions', async () => {
    const { container } = renderComponent({
      reaction_counts: {},
      themeVersion,
    });
    expect(container).toBeEmptyDOMElement();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render the total reaction count', async () => {
    const { container, getByText } = renderComponent({
      reaction_counts: {
        angry: 2,
        love: 5,
      },
      themeVersion,
    });
    const count = getByText('7');
    expect(count).toBeInTheDocument();
    expect(count).toHaveClass('str-chat__simple-reactions-list-item--last-number');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render an emoji for each type of reaction', async () => {
    const reaction_counts = {
      angry: 2,
      love: 5,
    };
    const { container } = renderComponent({ reaction_counts, themeVersion });

    expect(EmojiComponentMock).toHaveBeenCalledTimes(Object.keys(reaction_counts).length);

    Object.keys(reaction_counts).forEach(expectEmojiToHaveBeenRendered);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle custom reaction options', async () => {
    const reaction_counts = {
      banana: 1,
      cowboy: 2,
    };

    const { container } = renderComponent({
      reaction_counts,
      reactionOptions: [
        { emoji: '🍌', id: 'banana' },
        { emoji: '🤠', id: 'cowboy' },
      ],
      themeVersion,
    });

    expect(EmojiComponentMock).toHaveBeenCalledTimes(Object.keys(reaction_counts).length);

    Object.keys(reaction_counts).forEach(expectEmojiToHaveBeenRendered);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call handleReaction callback if a reaction emoji is clicked', async () => {
    const reaction_counts = {
      love: 1,
    };

    const { container, getByTestId } = renderComponent({ reaction_counts, themeVersion });

    fireEvent.click(getByTestId(loveEmojiTestId));

    expect(handleReactionMock).toHaveBeenCalledWith('love', expect.any(Object));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render a tooltip with all users that reacted a certain way if the emoji is hovered', async () => {
    const reaction_counts = {
      love: 3,
    };

    const { container, getByTestId, queryByText, reactions } = renderComponent({
      reaction_counts,
      themeVersion,
    });

    fireEvent.mouseEnter(getByTestId(loveEmojiTestId));

    reactions.forEach(({ user }) => {
      expect(queryByText(user.name || user.id, { exact: false })).toBeInTheDocument();
    });

    fireEvent.mouseLeave(getByTestId(loveEmojiTestId));

    reactions.forEach(({ user }) => {
      expect(queryByText(user.id, { exact: false })).not.toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

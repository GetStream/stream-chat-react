import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmojiComponentMock from 'emoji-mart/dist-modern/components/emoji/nimble-emoji';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { ReactionsList } from '../ReactionsList';

import { EmojiProvider } from '../../../context/EmojiContext';
import { MessageProvider } from '../../../context/MessageContext';

import { emojiComponentMock, emojiDataMock, generateReaction } from '../../../mock-builders';

jest.mock('emoji-mart/dist-modern/components/emoji/nimble-emoji', () =>
  jest.fn(({ emoji }) => <div data-testid={`emoji-${emoji.id}`} />),
);

const renderComponent = ({ reaction_counts = {}, ...props }) => {
  const reactions = Object.entries(reaction_counts)
    .map(([type, count]) =>
      Array(count)
        .fill()
        .map(() => generateReaction({ type })),
    )
    .flat();

  return render(
    <MessageProvider value={{}}>
      <EmojiProvider
        value={{
          Emoji: emojiComponentMock.Emoji,
          emojiConfig: emojiDataMock,
          EmojiIndex: emojiComponentMock.EmojiIndex,
          EmojiPicker: emojiComponentMock.EmojiPicker,
        }}
      >
        <ReactionsList reaction_counts={reaction_counts} reactions={reactions} {...props} />
      </EmojiProvider>
      ,
    </MessageProvider>,
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

  it('should render the total reaction count', async () => {
    const { container, getByText } = renderComponent({
      reaction_counts: {
        angry: 2,
        love: 5,
      },
    });
    const count = getByText('7');
    expect(count).toBeInTheDocument();
    expect(count).toHaveClass('str-chat__reaction-list--counter');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render an emoji for each type of reaction', async () => {
    const reaction_counts = {
      angry: 2,
      love: 5,
    };
    const { container } = renderComponent({ reaction_counts });

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
    });

    expect(EmojiComponentMock).toHaveBeenCalledTimes(Object.keys(reaction_counts).length);

    Object.keys(reaction_counts).forEach(expectEmojiToHaveBeenRendered);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should add reverse class if the prop is set to true', () => {
    const reaction_counts = {
      banana: 1,
      cowboy: 2,
    };
    const reactionOptions = [
      { emoji: '🍌', id: 'banana' },
      { emoji: '🤠', id: 'cowboy' },
    ];

    expect(
      renderComponent({ reaction_counts, reactionOptions, reverse: true }).container.querySelector(
        '.str-chat__reaction-list--reverse',
      ),
    ).toBeInTheDocument();

    expect(
      renderComponent({ reaction_counts, reactionOptions, reverse: false }).container.querySelector(
        '.str-chat__reaction-list--reverse',
      ),
    ).not.toBeInTheDocument();
  });
});

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmojiComponentMock from 'emoji-mart/dist-modern/components/emoji/nimble-emoji';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { ReactionSelector } from '../ReactionSelector';

import { Avatar as AvatarMock } from '../../Avatar';
import { defaultMinimalEmojis } from '../../Channel/emojiData';

import { ComponentProvider } from '../../../context/ComponentContext';
import { EmojiProvider } from '../../../context/EmojiContext';
import { MessageProvider } from '../../../context/MessageContext';

import {
  emojiComponentMock,
  emojiDataMock,
  generateReaction,
  generateUser,
} from '../../../mock-builders';

jest.mock('emoji-mart/dist-modern/components/emoji/nimble-emoji', () =>
  jest.fn(({ emoji }) => <div data-testid={`emoji-${emoji.id}`} />),
);

jest.mock('../../Avatar', () => ({
  Avatar: jest.fn(() => <div data-testid='avatar' />),
}));

const alice = generateUser({
  id: 'alice',
  image: 'alice-avatar.jpg',
  name: 'alice',
});

const bob = generateUser({
  id: 'bob',
  name: 'bob',
});

const handleReactionMock = jest.fn();

const renderComponent = (props) =>
  render(
    <ComponentProvider value={{ Avatar: AvatarMock }}>
      <MessageProvider value={{}}>
        <EmojiProvider
          value={{
            Emoji: emojiComponentMock.Emoji,
            emojiConfig: emojiDataMock,
            EmojiIndex: emojiComponentMock.EmojiIndex,
            EmojiPicker: emojiComponentMock.EmojiPicker,
          }}
        >
          <ReactionSelector handleReaction={handleReactionMock} {...props} />
        </EmojiProvider>
      </MessageProvider>
    </ComponentProvider>,
  );

describe('ReactionSelector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render each of default emojis if reactionOptions prop is not specified', async () => {
    const { container } = renderComponent();

    defaultMinimalEmojis.forEach((emoji) => {
      expect(EmojiComponentMock).toHaveBeenCalledWith(expect.objectContaining({ emoji }), {});
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render each of reactionOptions if specified', async () => {
    const reactionOptions = [
      { emoji: 'angry', id: 'angry' },
      { emoji: 'banana', id: 'banana' },
    ];
    const { container } = renderComponent({ reactionOptions });

    reactionOptions.forEach((emoji) => {
      expect(EmojiComponentMock).toHaveBeenCalledWith(
        expect.objectContaining({ emoji: expect.objectContaining(emoji) }),
        {},
      );
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render an avatar for the latest user that gave a certain reaction', async () => {
    const aliceReaction = generateReaction({ type: 'love', user: alice });
    const { container } = renderComponent({
      latest_reactions: [aliceReaction],
      reaction_counts: { love: 1 },
    });

    expect(AvatarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        image: alice.image,
        name: alice.name,
      }),
      {},
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render the count of reactions for each reaction', async () => {
    const love = 1;
    const angry = 2;
    const { container, getByText } = renderComponent({
      reaction_counts: {
        angry,
        love,
      },
    });

    const loveCount = getByText(`${love}`);
    const angryCount = getByText(`${angry}`);

    expect(loveCount).toBeInTheDocument();
    expect(angryCount).toBeInTheDocument();
    expect(loveCount.parentElement).toHaveAttribute('data-text', 'love');
    expect(angryCount.parentElement).toHaveAttribute('data-text', 'angry');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show / hide tooltip when hovering the avatar of the latest reactor', async () => {
    const aliceReaction = generateReaction({ type: 'love', user: alice });
    const bobReaction = generateReaction({ type: 'love', user: bob });
    const { container, findByText, getByTestId } = renderComponent({
      latest_reactions: [aliceReaction, bobReaction],
      reaction_counts: { love: 2 },
    });

    expect(AvatarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        image: alice.image,
        name: alice.name,
      }),
      {},
    );

    const avatarEl = getByTestId('avatar');

    fireEvent.mouseEnter(avatarEl.parentElement);

    const aliceTooltipText = await findByText(alice.name, { exact: false });
    expect(aliceTooltipText).toBeInTheDocument();
    expect(aliceTooltipText).toHaveClass('latest-user-username');
    const bobTooltipText = await findByText(bob.name);
    expect(bobTooltipText).toBeInTheDocument();
    expect(bobTooltipText).toHaveClass('latest-user-username');

    fireEvent.mouseLeave(avatarEl.parentElement);

    expect(aliceTooltipText).not.toBeInTheDocument();
    expect(bobTooltipText).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should add reverse class if the prop is set to true', () => {
    expect(
      renderComponent({ reverse: true }).container.querySelector(
        '.str-chat__reaction-selector--reverse',
      ),
    ).toBeInTheDocument();
    expect(
      renderComponent({ reverse: false }).container.querySelector(
        '.str-chat__reaction-selector--reverse',
      ),
    ).not.toBeInTheDocument();
  });

  it('should call handleReaction if an emoji is clicked', async () => {
    const { container, getByTestId } = renderComponent();

    const emoji = getByTestId('emoji-love');

    fireEvent.click(emoji);

    expect(handleReactionMock).toHaveBeenCalledWith('love', expect.any(Object));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

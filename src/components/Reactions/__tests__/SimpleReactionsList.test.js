import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import * as utils from '../utils/utils';
import { SimpleReactionsList } from '../SimpleReactionsList';
import { defaultReactionOptions } from '../reactionOptions';
import { MessageProvider } from '../../../context/MessageContext';

import { generateReaction } from '../../../mock-builders';
import { ComponentProvider } from '../../../context';

expect.extend(toHaveNoViolations);

const handleReactionMock = jest.fn();
// const loveEmojiTestId = 'emoji-love';

const renderComponent = ({ reaction_groups = {}, ...props }) => {
  const reactions = Object.entries(reaction_groups).flatMap(([type, { count }]) =>
    Array(count)
      .fill()
      .map((_, i) => generateReaction({ type, user: { id: `${USER_ID}-${i}` } })),
  );

  return {
    ...render(
      <ComponentProvider value={{ reactionOptions: defaultReactionOptions }}>
        <MessageProvider value={{}}>
          <SimpleReactionsList
            handleReaction={handleReactionMock}
            reaction_groups={reaction_groups}
            reactions={reactions}
            {...props}
          />
        </MessageProvider>
      </ComponentProvider>,
    ),
    reactions,
  };
};

const USER_ID = 'mark';

describe('SimpleReactionsList', () => {
  afterEach(jest.clearAllMocks);

  it('should not render anything if there are no reactions', async () => {
    const { container } = renderComponent({
      reaction_counts: {},
    });
    expect(container).toBeEmptyDOMElement();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
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
    expect(count).toHaveClass('str-chat__simple-reactions-list-item--last-number');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render an emoji for each type of reaction', async () => {
    const reaction_groups = {
      haha: { count: 2 },
      love: { count: 5 },
    };
    // force to render default fallbacks
    jest.spyOn(utils, 'getImageDimensions').mockRejectedValue('Error');
    jest.spyOn(console, 'error').mockImplementation(null);

    const { container } = renderComponent({ reaction_groups });

    expect(container).toMatchSnapshot();
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
        { emoji: '🍌', id: 'banana' },
        { emoji: '🤠', id: 'cowboy' },
      ],
    });

    expect(container).toMatchSnapshot();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call handleReaction callback if a reaction emoji is clicked', async () => {
    const reaction_groups = {
      love: { count: 1 },
    };

    const { container, getByText } = renderComponent({ reaction_groups });

    fireEvent.click(getByText('❤️'));

    expect(handleReactionMock).toHaveBeenCalledWith('love', expect.any(Object));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render a tooltip with all users that reacted a certain way if the emoji is hovered', async () => {
    const reaction_groups = {
      love: { count: 3 },
    };

    const { container, getByText, queryByText, reactions } = renderComponent({
      reaction_groups,
    });

    fireEvent.mouseEnter(getByText('❤️'));

    reactions.forEach(({ user }) => {
      expect(queryByText(user.name || user.id, { exact: false })).toBeInTheDocument();
    });

    fireEvent.mouseLeave(getByText('❤️'));

    reactions.forEach(({ user }) => {
      expect(queryByText(user.id, { exact: false })).not.toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

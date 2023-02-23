/* eslint-disable react/display-name */
import React from 'react';
import { render } from '@testing-library/react';
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

const generateButtonTitle = (count) =>
  Array.from({ length: count }, (_, i) => `${USER_ID}-${i}`).join(', ');

const renderComponent = ({ reaction_counts = {}, ...props }) => {
  const reactions = Object.entries(reaction_counts).flatMap(([type, count]) =>
    Array(count)
      .fill()
      .map((_, i) => generateReaction({ type, user: { id: `${USER_ID}-${i}` } })),
  );

  return render(
    <ComponentProvider value={{ reactionOptions: defaultReactionOptions }}>
      <MessageProvider value={{}}>
        <ReactionsList reaction_counts={reaction_counts} reactions={reactions} {...props} />,
      </MessageProvider>
    </ComponentProvider>,
  );
};

describe('ReactionsList', () => {
  afterEach(jest.clearAllMocks);

  // disable warnings (unreachable context)
  jest.spyOn(console, 'warn').mockImplementation(null);

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
      haha: 2,
      love: 5,
    };
    // make sure to render default fallbacks
    jest.spyOn(utils, 'getImageDimensions').mockRejectedValue('Error');
    jest.spyOn(console, 'error').mockImplementation(null);

    const { container, getByTestId } = renderComponent({ reaction_counts });

    const hahaButton = getByTestId('reactions-list-button-haha');
    const loveButton = getByTestId('reactions-list-button-love');

    expect(hahaButton).toHaveAttribute('title', generateButtonTitle(reaction_counts['haha']));
    expect(hahaButton.lastChild).toHaveTextContent(reaction_counts['haha']);
    expect(hahaButton.firstChild).toHaveTextContent('😂');

    expect(loveButton).toHaveAttribute('title', generateButtonTitle(reaction_counts['love']));
    expect(loveButton.lastChild).toHaveTextContent(reaction_counts['love']);
    expect(loveButton.firstChild).toHaveTextContent('❤️');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle custom reaction options', async () => {
    const reaction_counts = {
      banana: 1,
      cowboy: 2,
    };

    const { container, getByTestId } = renderComponent({
      reaction_counts,
      reactionOptions: [
        { Component: () => <>🍌</>, type: 'banana' },
        { Component: () => <>🤠</>, type: 'cowboy' },
      ],
    });

    const bananaButton = getByTestId('reactions-list-button-banana');
    const cowboyButton = getByTestId('reactions-list-button-cowboy');

    expect(bananaButton).toHaveAttribute('title', generateButtonTitle(reaction_counts['banana']));
    expect(bananaButton.lastChild).toHaveTextContent(reaction_counts['banana']);
    expect(bananaButton.firstChild).toHaveTextContent('🍌');
    expect(cowboyButton).toHaveAttribute('title', generateButtonTitle(reaction_counts['cowboy']));
    expect(cowboyButton.lastChild).toHaveTextContent(reaction_counts['cowboy']);
    expect(cowboyButton.firstChild).toHaveTextContent('🤠');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should add reverse class if the prop is set to true', () => {
    const reaction_counts = {
      banana: 1,
      cowboy: 2,
    };
    const reactionOptions = [
      { Component: () => <>🍌</>, type: 'banana' },
      { Component: () => <>🤠</>, type: 'cowboy' },
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

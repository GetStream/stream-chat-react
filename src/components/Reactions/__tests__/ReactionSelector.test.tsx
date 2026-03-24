// @ts-nocheck
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { ReactionSelector } from '../ReactionSelector';
import { defaultReactionOptions } from '../reactionOptions';

import { ComponentProvider } from '../../../context/ComponentContext';
import { MessageProvider } from '../../../context/MessageContext';
import { DialogManagerProvider } from '../../../context';

import { generateMessage, generateReaction } from '../../../mock-builders';

const handleReactionMock = vi.fn();

const renderComponent = ({ reactionOptions, ...props } = {}) =>
  render(
    <DialogManagerProvider>
      <ComponentProvider
        value={{ reactionOptions: reactionOptions ?? defaultReactionOptions }}
      >
        <MessageProvider value={{ message: generateMessage() }}>
          <ReactionSelector handleReaction={handleReactionMock} {...props} />
        </MessageProvider>
      </ComponentProvider>
    </DialogManagerProvider>,
  );

describe('ReactionSelector', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render each of the default quick reaction options as buttons', () => {
    const { getAllByTestId } = renderComponent();

    const buttons = getAllByTestId('select-reaction-button');
    // defaultReactionOptions.quick has 6 entries: haha, like, love, sad, wow, fire
    expect(buttons).toHaveLength(6);
  });

  it('should render each of reactionOptions if specified as an array (legacy format)', () => {
    const reactionOptions = [
      { Component: vi.fn(() => <span>test1</span>), type: 'test1' },
      { Component: vi.fn(() => <span>test2</span>), type: 'test2' },
    ];
    const { getAllByTestId } = renderComponent({ reactionOptions });

    const buttons = getAllByTestId('select-reaction-button');
    expect(buttons).toHaveLength(2);

    reactionOptions.forEach((option) => {
      expect(option.Component).toHaveBeenCalledTimes(1);
    });
  });

  it('should mark own reactions with aria-pressed', () => {
    const ownReaction = generateReaction({ type: 'love' });
    const { getAllByTestId } = renderComponent({
      own_reactions: [ownReaction],
    });

    const buttons = getAllByTestId('select-reaction-button');
    const loveButton = buttons.find((btn) => btn.getAttribute('data-text') === 'love');
    const hahaButton = buttons.find((btn) => btn.getAttribute('data-text') === 'haha');

    expect(loveButton).toHaveAttribute('aria-pressed', 'true');
    expect(hahaButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should call handleReaction when a reaction button is clicked', () => {
    const { getAllByTestId } = renderComponent();

    const buttons = getAllByTestId('select-reaction-button');
    const loveButton = buttons.find((btn) => btn.getAttribute('data-text') === 'love');

    fireEvent.click(loveButton);

    expect(handleReactionMock).toHaveBeenCalledWith('love', expect.any(Object));
  });

  it('should render the add button for extended reactions', () => {
    const { container } = renderComponent();
    const addButton = container.querySelector('.str-chat__reaction-selector__add-button');
    expect(addButton).toBeInTheDocument();
  });

  it('should show extended reaction list when add button is clicked', () => {
    const reactionOptions = {
      extended: {
        rocket: { Component: () => <>🚀</>, name: 'Rocket' },
        star: { Component: () => <>⭐</>, name: 'Star' },
      },
      quick: {
        love: { Component: () => <>❤️</>, name: 'Heart' },
      },
    };
    const { container } = renderComponent({ reactionOptions });

    const addButton = container.querySelector('.str-chat__reaction-selector__add-button');
    fireEvent.click(addButton);

    const extendedList = container.querySelector(
      '.str-chat__reaction-selector-extended-list',
    );
    expect(extendedList).toBeInTheDocument();

    // Quick list should be hidden when extended list is open
    const quickList = container.querySelector('.str-chat__reaction-selector-list');
    expect(quickList).not.toBeInTheDocument();
  });

  it('should have correct data-text attribute on each button', () => {
    const { getAllByTestId } = renderComponent();

    const buttons = getAllByTestId('select-reaction-button');
    const dataTexts = buttons.map((btn) => btn.getAttribute('data-text'));

    expect(dataTexts).toEqual(
      expect.arrayContaining(['haha', 'like', 'love', 'sad', 'wow', 'fire']),
    );
  });
});

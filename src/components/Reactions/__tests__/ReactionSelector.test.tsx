import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ReactionSelector, type ReactionSelectorProps } from '../ReactionSelector';
import { defaultReactionOptions, type ReactionOptions } from '../reactionOptions';

import { MessageProvider } from '../../../context/MessageContext';
import { DialogManagerProvider, WithComponents } from '../../../context';
import type { ComponentContextValue } from '../../../context/ComponentContext';

import {
  generateMessage,
  generateReaction,
  mockMessageContext,
} from '../../../mock-builders';

const handleReactionMock = vi.fn();

const defaultMessage = generateMessage();

const renderComponent = ({
  reactionOptions,
  ReactionSelectorExtendedList,
  ...props
}: Partial<ReactionSelectorProps> & {
  reactionOptions?: ReactionOptions;
  ReactionSelectorExtendedList?: ComponentContextValue['ReactionSelectorExtendedList'];
} = {}) =>
  render(
    <DialogManagerProvider>
      <WithComponents
        overrides={{
          reactionOptions: reactionOptions ?? defaultReactionOptions,
          ReactionSelectorExtendedList,
        }}
      >
        <MessageProvider value={mockMessageContext({ message: defaultMessage })}>
          <ReactionSelector handleReaction={handleReactionMock} {...props} />
        </MessageProvider>
      </WithComponents>
    </DialogManagerProvider>,
  );

const extendedReactionOptions: ReactionOptions = {
  extended: {
    rocket: { Component: () => <>🚀</>, name: 'Rocket' },
    star: { Component: () => <>⭐</>, name: 'Star' },
    thumbsdown: { Component: () => <>👎</>, name: 'Thumbs down' },
  },
  quick: {
    love: { Component: () => <>❤️</>, name: 'Heart' },
  },
};

const renderExtendedList = ({
  componentOverrides = {},
  messageOverrides = {},
  ...props
}: Partial<ReactionSelectorProps> & {
  componentOverrides?: Partial<ComponentContextValue>;
  messageOverrides?: Record<string, unknown>;
  dialogId?: string;
} = {}) =>
  render(
    <DialogManagerProvider>
      <WithComponents
        overrides={{
          reactionOptions: extendedReactionOptions,
          ...componentOverrides,
        }}
      >
        <MessageProvider
          value={mockMessageContext({
            message: defaultMessage,
            ...messageOverrides,
          })}
        >
          <ReactionSelector.ExtendedList
            dialogId={`test-dialog-${defaultMessage.id}`}
            {...props}
          />
        </MessageProvider>
      </WithComponents>
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
    const reactionOptions: ReactionOptions = [
      { Component: () => <span>test1</span>, type: 'test1' },
      { Component: () => <span>test2</span>, type: 'test2' },
    ];
    const { getAllByTestId } = renderComponent({ reactionOptions });

    const buttons = getAllByTestId('select-reaction-button');
    expect(buttons).toHaveLength(2);

    buttons.forEach((button, index) => {
      expect(button).toHaveTextContent(reactionOptions[index].type);
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
    const { getByTestId } = renderComponent();
    expect(getByTestId('reaction-selector-add-button')).toBeInTheDocument();
  });

  it('should show extended reaction list when add button is clicked', () => {
    const reactionOptions: ReactionOptions = {
      extended: {
        rocket: { Component: () => <>🚀</>, name: 'Rocket' },
        star: { Component: () => <>⭐</>, name: 'Star' },
      },
      quick: {
        love: { Component: () => <>❤️</>, name: 'Heart' },
      },
    };
    const { getByTestId, queryByTestId } = renderComponent({ reactionOptions });

    fireEvent.click(getByTestId('reaction-selector-add-button'));

    expect(getByTestId('reaction-selector-extended-list')).toBeInTheDocument();

    // Quick list should be unmounted when extended list is open
    expect(queryByTestId('reaction-selector-list')).not.toBeInTheDocument();
  });

  it('should have correct data-text attribute on each button', () => {
    const { getAllByTestId } = renderComponent();

    const buttons = getAllByTestId('select-reaction-button');
    const dataTexts = buttons.map((btn) => btn.getAttribute('data-text'));

    expect(dataTexts).toEqual(
      expect.arrayContaining(['haha', 'like', 'love', 'sad', 'wow', 'fire']),
    );
  });

  it('should use custom ReactionSelectorExtendedList from ComponentContext', () => {
    const CustomExtendedList = vi.fn(() => (
      <div data-testid='custom-extended-list'>Custom</div>
    ));

    const { getByTestId } = renderComponent({
      reactionOptions: extendedReactionOptions,
      ReactionSelectorExtendedList: CustomExtendedList,
    });

    fireEvent.click(getByTestId('reaction-selector-add-button'));

    expect(getByTestId('custom-extended-list')).toBeInTheDocument();
    expect(CustomExtendedList).toHaveBeenCalled();
  });
});

describe('ReactionSelector.ExtendedList', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render extended reaction buttons', () => {
    const { getAllByTestId } = renderExtendedList();

    const buttons = getAllByTestId('select-reaction-button');
    expect(buttons).toHaveLength(3);

    const dataTexts = buttons.map((btn) => btn.getAttribute('data-text'));
    expect(dataTexts).toEqual(expect.arrayContaining(['rocket', 'star', 'thumbsdown']));
  });

  it('should render null when reactionOptions is a legacy array', () => {
    const legacyOptions: ReactionOptions = [{ Component: () => <>❤️</>, type: 'love' }];

    const { queryByTestId } = renderExtendedList({
      componentOverrides: { reactionOptions: legacyOptions },
    });

    expect(queryByTestId('reaction-selector-extended-list')).not.toBeInTheDocument();
  });

  it('should render null when reactionOptions has no extended field', () => {
    const quickOnly: ReactionOptions = {
      quick: {
        love: { Component: () => <>❤️</>, name: 'Heart' },
      },
    };

    const { queryByTestId } = renderExtendedList({
      componentOverrides: { reactionOptions: quickOnly },
    });

    expect(queryByTestId('reaction-selector-extended-list')).not.toBeInTheDocument();
  });

  it('should mark own reactions with aria-pressed', () => {
    const ownReaction = generateReaction({ type: 'rocket' });
    const { getAllByTestId } = renderExtendedList({
      own_reactions: [ownReaction],
    });

    const buttons = getAllByTestId('select-reaction-button');
    const rocketButton = buttons.find(
      (btn) => btn.getAttribute('data-text') === 'rocket',
    );
    const starButton = buttons.find((btn) => btn.getAttribute('data-text') === 'star');

    expect(rocketButton).toHaveAttribute('aria-pressed', 'true');
    expect(starButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should call prop handleReaction over context handleReaction', () => {
    const propHandleReaction = vi.fn();
    const { getAllByTestId } = renderExtendedList({
      handleReaction: propHandleReaction,
    });

    const buttons = getAllByTestId('select-reaction-button');
    fireEvent.click(buttons[0]);

    expect(propHandleReaction).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should fall back to context handleReaction when prop is not provided', () => {
    const contextHandleReaction = vi.fn();
    const { getAllByTestId } = renderExtendedList({
      messageOverrides: { handleReaction: contextHandleReaction },
    });

    const buttons = getAllByTestId('select-reaction-button');
    fireEvent.click(buttons[0]);

    expect(contextHandleReaction).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should render correct aria-label using reaction name', () => {
    const { getAllByTestId } = renderExtendedList();

    const buttons = getAllByTestId('select-reaction-button');
    const rocketButton = buttons.find(
      (btn) => btn.getAttribute('data-text') === 'rocket',
    );

    expect(rocketButton).toHaveAttribute('aria-label', 'Select Reaction: Rocket');
  });

  it('should use reaction type as aria-label fallback when name is missing', () => {
    const optionsWithoutName: ReactionOptions = {
      extended: {
        custom: { Component: () => <>🎯</> },
      },
      quick: {
        love: { Component: () => <>❤️</>, name: 'Heart' },
      },
    };

    const { getByTestId } = renderExtendedList({
      componentOverrides: { reactionOptions: optionsWithoutName },
    });

    expect(getByTestId('select-reaction-button')).toHaveAttribute(
      'aria-label',
      'Select Reaction: custom',
    );
  });
});

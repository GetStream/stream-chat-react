import React from 'react';

import { cleanup, render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { axe } from '../../../../axe-helper';

import { DialogManagerProvider } from '../../../context';
import { SuggestionList } from '../SuggestionList';

const renderSuggestionList = () =>
  render(
    <DialogManagerProvider>
      <SuggestionList />
    </DialogManagerProvider>,
  );

const announceInteractionMock = vi.fn();

// F1: useInteractionAnnouncements already debounces + dedups `suggestions.count`
// internally, so the test asserts the CALL to announceInteraction (not the
// underlying live-region text).
vi.mock('../../Accessibility', () => ({
  useInteractionAnnouncements: () => ({
    announceInteraction: announceInteractionMock,
  }),
}));

vi.mock('../../../context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../context')>()),
  useComponentContext: () => ({}),
  useMessageComposerContext: () => ({
    textareaRef: { current: null },
  }),
  useTranslationContext: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../context/ComponentContext', () => ({
  useComponentContext: () => ({}),
}));

vi.mock('../../../context/MessageComposerContext', () => ({
  useMessageComposerContext: () => ({
    textareaRef: { current: null },
  }),
}));

const handleSelectMock = vi.fn();
const closeSuggestionsMock = vi.fn();

const composerController = {
  textComposer: {
    closeSuggestions: closeSuggestionsMock,
    handleSelect: handleSelectMock,
    state: {},
  },
};

vi.mock('../../MessageComposer/hooks', () => ({
  useMessageComposerCommands: () => [],
  useMessageComposerController: () => composerController,
}));

vi.mock('../../MessageComposer/hooks/useMessageComposerController', () => ({
  useMessageComposerController: () => composerController,
}));

// Drive the composer state the component reads via useStateStore. Both selectors
// (textComposerStateSelector -> { selection, suggestions } and
// searchSourceStateSelector -> { items }) read from a single shared fake state.
let fakeComposerState: {
  items: Array<{
    id: string;
    name: string;
    tokenizedDisplayName: { parts: string[]; token: string };
  }>;
  selection: { end: number; start: number };
  suggestions: {
    searchSource: { search: () => void; state: unknown; type: string };
    trigger: string;
  };
};

// Only intercept the composer's state stores (textComposer.state /
// searchSource.state — both `{}` in this harness). Any real StateStore (e.g. the
// DialogManager's, which exposes getLatestValue/subscribe) is delegated to the
// original implementation so dialog plumbing keeps working.
vi.mock('../../../store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../store')>();
  return {
    ...actual,
    useStateStore: ((state: unknown, selector: (state: unknown) => unknown) => {
      const isRealStore =
        !!state &&
        typeof (state as { getLatestValue?: unknown }).getLatestValue === 'function';
      if (isRealStore) {
        return (actual.useStateStore as typeof actual.useStateStore)(
          state as never,
          selector as never,
        );
      }
      return selector(fakeComposerState);
    }) as typeof actual.useStateStore,
  };
});

vi.mock('../../../utils/getTextareaCaretRect', () => ({
  getTextareaCaretRect: () => new DOMRect(0, 0, 1, 1),
}));

vi.mock('../../Dialog/hooks/usePopoverPosition', () => ({
  usePopoverPosition: () => ({
    refs: { setFloating: vi.fn(), setReference: vi.fn() },
    strategy: 'absolute',
    update: vi.fn(),
    x: 0,
    y: 0,
  }),
}));

const buildState = (count: number, type = 'mentions') => {
  const items = Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    name: `name-${i}`,
    tokenizedDisplayName: { parts: [`name-${i}`], token: 'name' },
  }));
  return {
    items,
    selection: { end: 1, start: 1 },
    suggestions: fromPartial<(typeof fakeComposerState)['suggestions']>({
      searchSource: { search: vi.fn(), state: {}, type },
      trigger: '@',
    }),
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  fakeComposerState = buildState(3);
});

afterEach(cleanup);

describe('SuggestionList', () => {
  it('announces the visible result count when the menu is shown', () => {
    renderSuggestionList();

    expect(announceInteractionMock).toHaveBeenCalledWith('suggestions.count', {
      count: 3,
      suggestionsLabel: 'aria/User Suggestions', // mentions → localized type label (t mock returns the key)
    });
  });

  it('announces the new count when the result set changes (filtering)', () => {
    const { rerender } = renderSuggestionList();

    expect(announceInteractionMock).toHaveBeenLastCalledWith('suggestions.count', {
      count: 3,
      suggestionsLabel: 'aria/User Suggestions',
    });

    fakeComposerState = buildState(1);
    rerender(
      <DialogManagerProvider>
        <SuggestionList />
      </DialogManagerProvider>,
    );

    expect(announceInteractionMock).toHaveBeenLastCalledWith('suggestions.count', {
      count: 1,
      suggestionsLabel: 'aria/User Suggestions',
    });
  });

  it('passes the localized type for an emoji source', () => {
    fakeComposerState = buildState(2, 'emojis');
    renderSuggestionList();
    expect(announceInteractionMock).toHaveBeenLastCalledWith('suggestions.count', {
      count: 2,
      suggestionsLabel: 'aria/Emoji Suggestions',
    });
  });

  it('does not announce when the list is not shown (no items)', () => {
    fakeComposerState = buildState(0);
    const { container } = renderSuggestionList();

    expect(container).toBeEmptyDOMElement();
    expect(announceInteractionMock).not.toHaveBeenCalled();
  });

  it('exposes reachable menu/menuitem semantics and has no axe violations', async () => {
    const { container } = renderSuggestionList();

    const menu = container.querySelector('[role="menu"]');
    expect(menu).toBeInTheDocument();

    const menuItems = container.querySelectorAll('[role="menuitem"]');
    expect(menuItems.length).toBe(3);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

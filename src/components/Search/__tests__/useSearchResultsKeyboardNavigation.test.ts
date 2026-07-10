import { renderHook } from '@testing-library/react';

import { useSearchResultsKeyboardNavigation } from '../hooks/useSearchResultsKeyboardNavigation';

const makeEvent = (key: string) => ({
  currentTarget: document.body,
  key,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

describe('useSearchResultsKeyboardNavigation', () => {
  let container: HTMLDivElement;
  let options: HTMLButtonElement[];

  beforeEach(() => {
    container = document.createElement('div');
    options = [0, 1, 2].map((i) => {
      const button = document.createElement('button');
      button.setAttribute('role', 'option');
      button.textContent = `option ${i}`;
      container.appendChild(button);
      return button;
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  const render = () =>
    renderHook(() => useSearchResultsKeyboardNavigation({ current: container }));

  it('moves focus to the next/previous option with ArrowDown/ArrowUp', () => {
    const { result } = render();
    options[0].focus();

    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(options[1]);

    result.current.onKeyDown(makeEvent('ArrowUp'));
    expect(document.activeElement).toBe(options[0]);
  });

  it('jumps to first/last with Home/End', () => {
    const { result } = render();
    options[1].focus();

    result.current.onKeyDown(makeEvent('End'));
    expect(document.activeElement).toBe(options[2]);

    result.current.onKeyDown(makeEvent('Home'));
    expect(document.activeElement).toBe(options[0]);
  });

  it('wraps around at the edges', () => {
    const { result } = render();
    options[2].focus();

    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(options[0]);

    result.current.onKeyDown(makeEvent('ArrowUp'));
    expect(document.activeElement).toBe(options[2]);
  });

  it('does not handle ArrowLeft/ArrowRight (no horizontal nav)', () => {
    const { result } = render();
    options[0].focus();

    const left = makeEvent('ArrowLeft');
    const right = makeEvent('ArrowRight');
    result.current.onKeyDown(left);
    result.current.onKeyDown(right);

    expect(document.activeElement).toBe(options[0]);
    expect(left.preventDefault).not.toHaveBeenCalled();
    expect(right.preventDefault).not.toHaveBeenCalled();
  });

  it('moves to a channel result row actions button with ArrowRight and back with ArrowLeft', () => {
    // A channel/message result: row container + option button + an action button.
    const row = document.createElement('div');
    row.className = 'str-chat__channel-list-item-container';
    const rowOption = document.createElement('button');
    rowOption.setAttribute('role', 'option');
    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'str-chat__channel-list-item__action-buttons';
    const actionButton = document.createElement('button');
    actionsWrapper.appendChild(actionButton);
    row.append(rowOption, actionsWrapper);
    container.appendChild(row);

    const { result } = render();
    rowOption.focus();

    result.current.onKeyDown(makeEvent('ArrowRight'));
    expect(document.activeElement).toBe(actionButton);

    result.current.onKeyDown(makeEvent('ArrowLeft'));
    expect(document.activeElement).toBe(rowOption);
  });

  it('does not move on ArrowRight for a user result (no action buttons)', () => {
    // User results use a different container with no action buttons.
    const userContainer = document.createElement('div');
    userContainer.className = 'str-chat__search-result-container';
    const userOption = document.createElement('button');
    userOption.setAttribute('role', 'option');
    userContainer.appendChild(userOption);
    container.appendChild(userContainer);

    const { result } = render();
    userOption.focus();

    const right = makeEvent('ArrowRight');
    result.current.onKeyDown(right);
    expect(document.activeElement).toBe(userOption);
    expect(right.preventDefault).not.toHaveBeenCalled();
  });

  it('does nothing when focus is outside the container', () => {
    const { result } = render();
    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();

    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(outside);

    outside.remove();
  });

  it('enters the list from a non-option inside the container (e.g. a filter tag)', () => {
    // A filter button precedes the options inside the same container.
    const filterTag = document.createElement('button');
    container.insertBefore(filterTag, options[0]);
    const { result } = render();
    filterTag.focus();

    // Home / ArrowDown jump to the first option...
    result.current.onKeyDown(makeEvent('Home'));
    expect(document.activeElement).toBe(options[0]);

    filterTag.focus();
    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(options[0]);

    // ...End / ArrowUp jump to the last option.
    filterTag.focus();
    result.current.onKeyDown(makeEvent('End'));
    expect(document.activeElement).toBe(options[2]);
  });
});

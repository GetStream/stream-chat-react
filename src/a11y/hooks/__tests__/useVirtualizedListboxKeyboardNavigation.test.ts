import type { KeyboardEvent } from 'react';
import { renderHook } from '@testing-library/react';

import { useVirtualizedListboxKeyboardNavigation } from '../useVirtualizedListboxKeyboardNavigation';

// Only what the hook reads of a keyboard event.
const makeEvent = (key: string) =>
  ({
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }) as unknown as KeyboardEvent<HTMLElement>;

describe('useVirtualizedListboxKeyboardNavigation', () => {
  // The full list; the DOM only ever holds a subset of it (the rendered window).
  const ITEMS = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));
  let scroller: HTMLDivElement;

  const renderOption = (id: string) => {
    const option = document.createElement('button');
    option.setAttribute('role', 'option');
    option.setAttribute('data-thread-id', id);
    scroller.appendChild(option);
    return option;
  };
  const optionFor = (id: string) =>
    scroller.querySelector<HTMLElement>(`[data-thread-id="${id}"]`);

  beforeEach(() => {
    scroller = document.createElement('div');
    document.body.appendChild(scroller);
  });

  afterEach(() => {
    scroller.remove();
  });

  const setup = (scrollIndexIntoView: (index: number, onRendered: () => void) => void) =>
    renderHook(() =>
      useVirtualizedListboxKeyboardNavigation({
        getItemId: (item: { id: string }) => item.id,
        itemIdAttribute: 'data-thread-id',
        items: ITEMS,
        scrollerRef: { current: scroller },
        scrollIndexIntoView,
      }),
    );

  // A scroll that simulates virtualization: it renders the requested row, then reports it rendered.
  const renderingScroll = vi.fn((index: number, onRendered: () => void) => {
    renderOption(ITEMS[index].id);
    onRendered();
  });

  it('roves within the rendered window without scrolling', () => {
    ['a', 'b', 'c'].forEach(renderOption);
    const scroll = vi.fn();
    const { result } = setup(scroll);
    optionFor('a')!.focus();

    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(optionFor('b'));
    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(optionFor('c'));

    expect(scroll).not.toHaveBeenCalled();
  });

  it('scrolls an off-window index into view, then focuses it once rendered', () => {
    ['a', 'b', 'c'].forEach(renderOption);
    const scroll = vi.fn(renderingScroll);
    const { result } = setup(scroll);
    optionFor('c')!.focus(); // last rendered row; 'd' (index 3) is not in the DOM

    result.current.onKeyDown(makeEvent('ArrowDown'));

    expect(scroll).toHaveBeenLastCalledWith(3, expect.any(Function));
    expect(document.activeElement).toBe(optionFor('d'));
  });

  it('moves on from the pending target while an off-window scroll is still settling', () => {
    // react-virtuoso 4 reports a scroll done only once it settled, so a held arrow key presses
    // again before the next row is focused: each press must still advance one row.
    renderOption('a');
    const pending: (() => void)[] = [];
    const deferredScroll = vi.fn((index: number, onRendered: () => void) => {
      pending.push(() => {
        renderOption(ITEMS[index].id);
        onRendered();
      });
    });
    const { result } = setup(deferredScroll);
    optionFor('a')!.focus();

    result.current.onKeyDown(makeEvent('ArrowDown'));
    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(deferredScroll).toHaveBeenNthCalledWith(1, 1, expect.any(Function));
    expect(deferredScroll).toHaveBeenNthCalledWith(2, 2, expect.any(Function));

    pending.forEach((settle) => settle());
    expect(document.activeElement).toBe(optionFor('c'));
  });

  it('starts from the focused row again once focus moved away from a pending chain', () => {
    ['a', 'b'].forEach(renderOption);
    const neverSettles = vi.fn();
    const { result } = setup(neverSettles);
    optionFor('a')!.focus();
    result.current.onKeyDown(makeEvent('End'));
    expect(neverSettles).toHaveBeenLastCalledWith(4, expect.any(Function));

    // The user clicks row b while the scroll to the end is still pending.
    optionFor('b')!.focus();
    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(neverSettles).toHaveBeenLastCalledWith(2, expect.any(Function));
  });

  it('End scrolls to the last item; Home returns to the first', () => {
    ['a', 'b', 'c'].forEach(renderOption);
    const scroll = vi.fn(renderingScroll);
    const { result } = setup(scroll);
    optionFor('a')!.focus();

    result.current.onKeyDown(makeEvent('End'));
    expect(scroll).toHaveBeenLastCalledWith(4, expect.any(Function));
    expect(document.activeElement).toBe(optionFor('e'));

    result.current.onKeyDown(makeEvent('Home')); // 'a' is still rendered
    expect(document.activeElement).toBe(optionFor('a'));
  });

  it('enters the list from a non-option (e.g. the focused container) on ArrowDown', () => {
    ['a', 'b', 'c'].forEach(renderOption);
    const { result } = setup(vi.fn());
    scroller.tabIndex = 0;
    scroller.focus();

    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(optionFor('a'));
  });

  it('preventDefault + stopPropagation for handled keys; ignores others', () => {
    ['a', 'b', 'c'].forEach(renderOption);
    const scroll = vi.fn();
    const { result } = setup(scroll);
    optionFor('a')!.focus();

    const down = makeEvent('ArrowDown');
    result.current.onKeyDown(down);
    expect(down.preventDefault).toHaveBeenCalled();
    expect(down.stopPropagation).toHaveBeenCalled();

    const enter = makeEvent('Enter');
    result.current.onKeyDown(enter);
    expect(enter.preventDefault).not.toHaveBeenCalled();
    expect(enter.stopPropagation).not.toHaveBeenCalled();
    expect(scroll).not.toHaveBeenCalled();
  });
});

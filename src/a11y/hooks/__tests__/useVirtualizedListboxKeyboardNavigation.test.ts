import { renderHook } from '@testing-library/react';

import { useVirtualizedListboxKeyboardNavigation } from '../useVirtualizedListboxKeyboardNavigation';

const makeEvent = (key: string) => ({
  key,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

describe('useVirtualizedListboxKeyboardNavigation', () => {
  // The full (unvirtualized) list. The DOM only ever holds a subset (the "rendered window").
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

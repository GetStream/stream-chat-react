import React, { createRef } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { GroupedVirtuoso, Virtuoso, VirtuosoMockContext } from 'react-virtuoso';
import type { ItemProps, VirtuosoHandle } from 'react-virtuoso';

/**
 * The parts of react-virtuoso's contract the SDK builds on, pinned against the real component.
 * jsdom has no layout, so `VirtuosoMockContext` supplies the viewport and item sizes. Real scrolling
 * and measurement are covered by the browser suites (`__tests__/browser`).
 */

const mockContext = { itemHeight: 30, viewportHeight: 300 };

// jsdom implements neither Element.scrollTo nor Element.scrollBy, through which Virtuoso scrolls
// (initial location, scrollIntoView, prepend compensation). These set scrollTop, as a browser does
// for an instant scroll.
type ScrollArgs = [ScrollToOptions | number | undefined, number?];
const toTop = (element: Element, args: ScrollArgs, relative: boolean) => {
  const [first, second] = args;
  const top = typeof first === 'object' ? first?.top : second;
  if (typeof top !== 'number') return;
  element.scrollTop = relative ? element.scrollTop + top : top;
  element.dispatchEvent(new Event('scroll'));
};
beforeAll(() => {
  Element.prototype.scrollTo = function (this: Element, ...args: ScrollArgs) {
    toTop(this, args, false);
  } as Element['scrollTo'];
  Element.prototype.scrollBy = function (this: Element, ...args: ScrollArgs) {
    toTop(this, args, true);
  } as Element['scrollBy'];
});
afterAll(() => {
  delete (Element.prototype as Partial<Element>).scrollTo;
  delete (Element.prototype as Partial<Element>).scrollBy;
});

const renderInMock = (element: React.ReactElement) =>
  render(
    <VirtuosoMockContext.Provider value={mockContext}>
      {element}
    </VirtuosoMockContext.Provider>,
  );

const PREPEND_OFFSET = 10 ** 7;

describe('react-virtuoso contract', () => {
  it('J-01 hands a custom Item its absolute index and keeps the item data off the DOM', () => {
    const seen: number[] = [];
    // The shape of the SDK's own `Item` (VirtualizedMessageListComponents): it reads
    // `data-item-index` and spreads the rest onto a <div>.
    const Item = ({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept off the <div>, as the SDK's Item does
      context: _context,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept off the <div>, as the SDK's Item does
      item: _item,
      ...props
    }: ItemProps<unknown> & { context?: unknown }) => {
      seen.push(props['data-item-index']);
      return <div {...props} />;
    };
    const { container } = renderInMock(
      <Virtuoso
        components={{ Item }}
        firstItemIndex={PREPEND_OFFSET - 5}
        itemContent={(index) => <span>row {index}</span>}
        totalCount={20}
      />,
    );
    expect(seen[0]).toBe(PREPEND_OFFSET - 5);
    const wrapper = container.querySelector('[data-item-index]');
    expect(wrapper?.getAttribute('data-item-index')).toBe(String(PREPEND_OFFSET - 5));
    expect(wrapper?.hasAttribute('item')).toBe(false);
  });

  it('J-02 keeps the DOM node of an item that stays rendered across a prepend', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `m-${i}`);
    const view = (items: string[], firstItemIndex: number) => (
      <VirtuosoMockContext.Provider value={mockContext}>
        <Virtuoso
          computeItemKey={(index) => items[index - firstItemIndex]}
          firstItemIndex={firstItemIndex}
          itemContent={(index) => <span data-id={items[index - firstItemIndex]} />}
          totalCount={items.length}
        />
      </VirtuosoMockContext.Provider>
    );
    const { container, rerender } = render(view(ids, PREPEND_OFFSET));
    const before = container.querySelector('[data-id="m-2"]');
    rerender(view(['p-0', 'p-1', ...ids], PREPEND_OFFSET - 2));
    expect(container.querySelector('[data-id="m-2"]')).toBe(before);
  });

  it('J-03 reports rendered items with 0-based original indexes, the first one included', () => {
    const reports: (number | undefined)[][] = [];
    renderInMock(
      <Virtuoso
        firstItemIndex={PREPEND_OFFSET}
        itemContent={(index) => <span>{index}</span>}
        itemsRendered={(items) => reports.push(items.map((item) => item.originalIndex))}
        totalCount={20}
      />,
    );
    const last = reports[reports.length - 1];
    expect(last[0]).toBe(0);
    expect(last).toContain(1);
  });

  it('J-04 re-renders visible items when `context` changes', () => {
    const view = (label: string) => (
      <VirtuosoMockContext.Provider value={mockContext}>
        <Virtuoso
          context={{ label }}
          itemContent={(index, _data, context: { label: string }) => (
            <span>
              {context.label} {index}
            </span>
          )}
          totalCount={5}
        />
      </VirtuosoMockContext.Provider>
    );
    const { rerender } = render(view('before'));
    expect(screen.getByText('before 0')).toBeInTheDocument();
    rerender(view('after'));
    expect(screen.getByText('after 0')).toBeInTheDocument();
  });

  // Virtuoso positions a list asynchronously (it waits frames, then for the list to stop changing).
  const POSITIONING_TIMEOUT = { timeout: 2000 };

  it('J-06 survives an empty list opened at its end, then filling it', async () => {
    const view = (count: number) => (
      <VirtuosoMockContext.Provider value={mockContext}>
        <Virtuoso
          components={{ EmptyPlaceholder: () => <div>empty</div> }}
          initialTopMostItemIndex={{ align: 'end', index: count - 1 }}
          itemContent={(index) => <span>row {index}</span>}
          totalCount={count}
        />
      </VirtuosoMockContext.Provider>
    );
    const { rerender } = render(view(0));
    expect(screen.getByText('empty')).toBeInTheDocument();
    rerender(view(5));
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
    expect(
      await screen.findByText('row 4', undefined, POSITIONING_TIMEOUT),
    ).toBeInTheDocument();
  });

  it('J-06b opens at the requested end of the list', async () => {
    renderInMock(
      <Virtuoso
        initialTopMostItemIndex={{ align: 'end', index: 99 }}
        itemContent={(index) => <span>row {index}</span>}
        totalCount={100}
      />,
    );
    expect(
      await screen.findByText('row 99', undefined, POSITIONING_TIMEOUT),
    ).toBeInTheDocument();
  });

  it('J-07 renders the scroller as the root, carrying the props the SDK and its styles rely on', () => {
    const onKeyDown = vi.fn();
    const { container } = renderInMock(
      <Virtuoso
        aria-label='Thread list'
        className='str-chat__thread-list'
        itemContent={(index) => <span>row {index}</span>}
        onKeyDown={onKeyDown}
        role='listbox'
        style={{ overflowX: 'hidden' }}
        totalCount={5}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('data-virtuoso-scroller')).toBe('true');
    expect(root).toHaveClass('str-chat__thread-list');
    expect(root.getAttribute('role')).toBe('listbox');
    expect(root.getAttribute('aria-label')).toBe('Thread list');
    expect(root.getAttribute('tabindex')).toBe('0');
    expect(root.style.overflowX).toBe('hidden');
    expect(root.querySelector('[data-viewport-type="element"]')).not.toBeNull();
    root.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    expect(onKeyDown).toHaveBeenCalled();
  });

  describe('J-08 scrollerRef', () => {
    // Virtuoso's window and custom-parent viewports observe their size; jsdom has no
    // ResizeObserver.
    const OriginalResizeObserver = globalThis.ResizeObserver;
    beforeEach(() => {
      globalThis.ResizeObserver = class {
        disconnect() {}
        observe() {}
        unobserve() {}
      } as unknown as typeof ResizeObserver;
    });
    afterEach(() => {
      globalThis.ResizeObserver = OriginalResizeObserver;
    });

    it('gets the scroller element, then null on unmount', () => {
      const scrollerRef = vi.fn();
      const { unmount } = renderInMock(
        <Virtuoso
          itemContent={(i) => <span>{i}</span>}
          scrollerRef={scrollerRef}
          totalCount={3}
        />,
      );
      const element = scrollerRef.mock.calls.find(
        ([value]) => value instanceof HTMLElement,
      )?.[0];
      expect(element?.getAttribute('data-virtuoso-scroller')).toBe('true');
      unmount();
      expect(scrollerRef).toHaveBeenLastCalledWith(null);
    });

    it('gets the window with useWindowScroll', () => {
      const scrollerRef = vi.fn();
      renderInMock(
        <Virtuoso
          itemContent={(i) => <span>{i}</span>}
          scrollerRef={scrollerRef}
          totalCount={3}
          useWindowScroll
        />,
      );
      expect(scrollerRef).toHaveBeenCalledWith(window);
    });

    it('gets the custom scroll parent', () => {
      const scrollerRef = vi.fn();
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      renderInMock(
        <Virtuoso
          customScrollParent={parent}
          itemContent={(i) => <span>{i}</span>}
          scrollerRef={scrollerRef}
          totalCount={3}
        />,
      );
      expect(scrollerRef).toHaveBeenCalledWith(parent);
      parent.remove();
    });
  });

  it('J-09 calls `done` once scrollIntoView rendered the target', async () => {
    const ref = createRef<VirtuosoHandle>();
    renderInMock(
      <Virtuoso itemContent={(i) => <span>row {i}</span>} ref={ref} totalCount={200} />,
    );
    const done = vi.fn();
    act(() => {
      ref.current?.scrollIntoView({ done, index: 150 });
    });
    await waitFor(() => expect(done).toHaveBeenCalled(), POSITIONING_TIMEOUT);
  });

  it('J-10 GroupedVirtuoso passes flat item indexes and sticks its group wrappers', () => {
    const indexes: number[] = [];
    const { container } = renderInMock(
      <GroupedVirtuoso
        groupContent={(group) => <span>group {group}</span>}
        groupCounts={[2, 3]}
        itemContent={(index) => {
          indexes.push(index);
          return <span>item {index}</span>;
        }}
      />,
    );
    expect(indexes.slice(0, 5)).toEqual([0, 1, 2, 3, 4]);
    const group = screen.getByText('group 0').parentElement as HTMLElement;
    // jsdom serializes the prefixed spelling.
    expect(['sticky', '-webkit-sticky']).toContain(group.style.position);
    expect(container).toBeTruthy();
  });
});

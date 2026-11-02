import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';

import { FloatingDateSeparator } from '../FloatingDateSeparator';
import { WithComponents } from '../../../context/WithComponents';
import type { DateSeparatorProps } from '../../DateSeparator';
import type { RenderedMessage } from '../utils';

vi.mock('lodash.throttle', () => ({
  default: <T extends (...args: never[]) => void>(fn: T) =>
    Object.assign((...args: Parameters<T>) => fn(...args), { cancel: vi.fn() }),
}));

const IDLE_MS = 1000;
const jan1 = new Date('2025-01-01T12:00:00Z');
const jan2 = new Date('2025-01-02T12:00:00Z');

const mockRect = (element: HTMLElement, top: number, bottom: number) => {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom,
    height: bottom - top,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top,
    width: 0,
    x: 0,
    y: top,
  });
};

// The list's top edge is at 100px; its only inline separator has scrolled out above it.
const makeScrolledListElement = () => {
  const listElement = document.createElement('div');
  mockRect(listElement, 100, 500);

  const separator = document.createElement('div');
  separator.className = 'str-chat__date-separator';
  separator.setAttribute('data-date', jan1.toISOString());
  mockRect(separator, 60, 80);
  listElement.appendChild(separator);

  return listElement;
};

const TestDateSeparator = ({ date, floating }: DateSeparatorProps) => (
  <div data-testid={floating ? 'floating' : 'inline'}>{date.toISOString()}</div>
);

const renderFloating = (listElement: HTMLDivElement, withDateSeparator = true) =>
  render(
    <WithComponents overrides={{ DateSeparator: TestDateSeparator }}>
      <FloatingDateSeparator
        listElement={listElement}
        processedMessages={[{} as RenderedMessage]}
        withDateSeparator={withDateSeparator}
      />
    </WithComponents>,
  );

const addInlineSeparator = (listElement: HTMLElement, top: number) => {
  const separator = document.createElement('div');
  separator.className = 'str-chat__date-separator';
  separator.setAttribute('data-date', jan2.toISOString());
  mockRect(separator, top, top + 20);
  listElement.appendChild(separator);
};

const dec31 = new Date('2024-12-31T12:00:00Z');

type ScrollerSeparator = {
  date: Date;
  top: number;
  /** Rendered outside Virtuoso's items, like the thread's parent message in the list header. */
  inHeader?: boolean;
};

// The scroller's top edge is at 100px; each inline separator is 20px tall.
const makeVirtualizedScroller = (separators: ScrollerSeparator[] = []) => {
  const scroller = document.createElement('div');
  mockRect(scroller, 100, 500);
  separators.forEach(({ date, inHeader, top }, index) => {
    const separator = document.createElement('div');
    separator.className = 'str-chat__date-separator';
    separator.setAttribute('data-date', date.toISOString());
    mockRect(separator, top, top + 20);
    if (inHeader) {
      scroller.appendChild(separator);
      return;
    }
    const item = document.createElement('div');
    item.setAttribute('data-item-index', String(index));
    item.appendChild(separator);
    scroller.appendChild(item);
  });
  return scroller;
};

const dateSeparatorItem = {
  customType: 'message.date',
  date: jan1,
  id: 'date-jan1',
  type: 'date',
} as unknown as RenderedMessage;
const messageItem = {
  created_at: jan1,
  id: 'm1',
  type: 'regular',
} as unknown as RenderedMessage;

const jan2DateSeparatorItem = {
  customType: 'message.date',
  date: jan2,
  id: 'date-jan2',
  type: 'date',
} as unknown as RenderedMessage;
const jan2MessageItem = {
  created_at: jan2,
  id: 'm2',
  type: 'regular',
} as unknown as RenderedMessage;

const renderVirtualizedFloating = (
  scrollElement: HTMLElement | Window,
  renderedItems: RenderedMessage[] = [messageItem],
  withDateSeparator = true,
) => {
  const itemsRenderedRef = createRef<((rendered: RenderedMessage[]) => void) | null>();
  render(
    <WithComponents overrides={{ DateSeparator: TestDateSeparator }}>
      <FloatingDateSeparator
        itemsRenderedRef={itemsRenderedRef}
        processedMessages={[
          dateSeparatorItem,
          messageItem,
          jan2DateSeparatorItem,
          jan2MessageItem,
        ]}
        scrollElement={scrollElement}
        withDateSeparator={withDateSeparator}
      />
    </WithComponents>,
  );
  act(() => {
    itemsRenderedRef.current?.(renderedItems);
    scrollElement.dispatchEvent(new Event('scroll'));
  });
};

describe('FloatingDateSeparator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('stays hidden while the list is at rest', () => {
    renderFloating(makeScrolledListElement());

    expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
  });

  it('shows while the list scrolls and hides once scrolling stops', () => {
    const listElement = makeScrolledListElement();
    renderFloating(listElement);

    act(() => {
      listElement.dispatchEvent(new Event('scroll'));
    });
    expect(screen.getByTestId('floating')).toHaveTextContent(jan1.toISOString());

    act(() => {
      vi.advanceTimersByTime(IDLE_MS);
    });
    expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
  });

  it('stays hidden while scrolling when date separators are disabled', () => {
    const listElement = makeScrolledListElement();
    renderFloating(listElement, false);

    act(() => {
      listElement.dispatchEvent(new Event('scroll'));
    });

    expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
  });

  it('stays hidden while scrolling when the next inline separator sits in the floating spot', () => {
    const listElement = makeScrolledListElement();
    addInlineSeparator(listElement, 110);
    renderFloating(listElement);

    act(() => {
      listElement.dispatchEvent(new Event('scroll'));
    });

    expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
  });

  describe('in VirtualizedMessageList', () => {
    it('shows the date of the first visible message while the list scrolls', () => {
      renderVirtualizedFloating(makeVirtualizedScroller());

      expect(screen.getByTestId('floating')).toHaveTextContent(jan1.toISOString());
    });

    it('stays hidden while an inline separator sits where the floating one would be drawn', () => {
      renderVirtualizedFloating(makeVirtualizedScroller([{ date: jan2, top: 110 }]));

      expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
    });

    it('stays hidden while an inline separator rendered first sits below the floating spot', () => {
      // Content above the first item, such as the loading indicator, pushes it down.
      renderVirtualizedFloating(makeVirtualizedScroller([{ date: jan1, top: 140 }]), [
        dateSeparatorItem,
        messageItem,
      ]);

      expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
    });

    it('stays hidden while an unmeasurable inline separator is rendered first', () => {
      // A custom `DateSeparator` without the `str-chat__date-separator` class.
      renderVirtualizedFloating(makeVirtualizedScroller(), [
        dateSeparatorItem,
        messageItem,
      ]);

      expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
    });

    // With a raised `overscan` or `increaseViewportBy.top`, Virtuoso renders items above the viewport.
    it('shows the date of an inline separator rendered first but already scrolled above the top', () => {
      renderVirtualizedFloating(makeVirtualizedScroller([{ date: jan1, top: 60 }]), [
        dateSeparatorItem,
        messageItem,
      ]);

      expect(screen.getByTestId('floating')).toHaveTextContent(jan1.toISOString());
    });

    it('takes the date of the last rendered separator above the top over the first rendered item', () => {
      renderVirtualizedFloating(makeVirtualizedScroller([{ date: jan2, top: 60 }]), [
        messageItem,
      ]);

      expect(screen.getByTestId('floating')).toHaveTextContent(jan2.toISOString());
    });

    it('ignores a measured date older than the first rendered item', () => {
      // Right after a jump down, the list is measured before Virtuoso swaps out the old items.
      renderVirtualizedFloating(makeVirtualizedScroller([{ date: jan1, top: -5000 }]), [
        jan2MessageItem,
      ]);

      expect(screen.getByTestId('floating')).toHaveTextContent(jan2.toISOString());
    });

    it('stays hidden when the measured date is stale and a separator is rendered first', () => {
      renderVirtualizedFloating(makeVirtualizedScroller([{ date: jan1, top: -5000 }]), [
        jan2DateSeparatorItem,
        jan2MessageItem,
      ]);

      expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
    });

    it('keeps a measured date on the same day as the first rendered item', () => {
      const jan2Morning = new Date('2025-01-02T08:00:00Z');
      renderVirtualizedFloating(
        makeVirtualizedScroller([{ date: jan2Morning, top: 60 }]),
        [jan2MessageItem],
      );

      expect(screen.getByTestId('floating')).toHaveTextContent(jan2Morning.toISOString());
    });

    it('takes the measured date when the intro is rendered first', () => {
      const introItem = {
        customType: 'channel.intro',
        id: 'intro',
      } as unknown as RenderedMessage;
      renderVirtualizedFloating(makeVirtualizedScroller([{ date: jan1, top: 60 }]), [
        introItem,
      ]);

      expect(screen.getByTestId('floating')).toHaveTextContent(jan1.toISOString());
    });

    it('ignores a separator outside the rendered items when picking the date', () => {
      renderVirtualizedFloating(
        makeVirtualizedScroller([{ date: dec31, inHeader: true, top: 20 }]),
      );

      expect(screen.getByTestId('floating')).toHaveTextContent(jan1.toISOString());
    });

    it('stays hidden while a separator outside the rendered items sits in the floating spot', () => {
      renderVirtualizedFloating(
        makeVirtualizedScroller([{ date: dec31, inHeader: true, top: 100 }]),
      );

      expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
    });

    it('stays hidden while scrolling when date separators are disabled', () => {
      renderVirtualizedFloating(makeVirtualizedScroller(), [messageItem], false);

      expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
    });

    it('stays hidden in window-scroll mode while an inline separator is rendered first', () => {
      renderVirtualizedFloating(window, [dateSeparatorItem, messageItem]);

      expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
    });

    it('shows in window-scroll mode once a message is rendered first', () => {
      renderVirtualizedFloating(window);

      expect(screen.getByTestId('floating')).toHaveTextContent(jan1.toISOString());
    });
  });
});

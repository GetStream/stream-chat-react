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
  separator.setAttribute('data-date', new Date('2025-01-02T12:00:00Z').toISOString());
  mockRect(separator, top, top + 20);
  listElement.appendChild(separator);
};

const makeVirtualizedScroller = (separatorTop: number | null) => {
  const scroller = document.createElement('div');
  mockRect(scroller, 100, 500);
  if (separatorTop !== null) {
    const separator = document.createElement('div');
    separator.className = 'str-chat__date-separator';
    mockRect(separator, separatorTop, separatorTop + 20);
    scroller.appendChild(separator);
  }
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

const renderVirtualizedFloating = (scrollElement: HTMLElement) => {
  const itemsRenderedRef = createRef<((rendered: RenderedMessage[]) => void) | null>();
  render(
    <WithComponents overrides={{ DateSeparator: TestDateSeparator }}>
      <FloatingDateSeparator
        itemsRenderedRef={itemsRenderedRef}
        processedMessages={[dateSeparatorItem, messageItem]}
        scrollElement={scrollElement}
        withDateSeparator
      />
    </WithComponents>,
  );
  act(() => {
    itemsRenderedRef.current?.([messageItem]);
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
      renderVirtualizedFloating(makeVirtualizedScroller(null));

      expect(screen.getByTestId('floating')).toHaveTextContent(jan1.toISOString());
    });

    it('stays hidden while an inline separator sits where the floating one would be drawn', () => {
      renderVirtualizedFloating(makeVirtualizedScroller(110));

      expect(screen.queryByTestId('floating')).not.toBeInTheDocument();
    });
  });
});

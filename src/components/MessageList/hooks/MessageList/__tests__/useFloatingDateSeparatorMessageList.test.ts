import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFloatingDateSeparatorMessageList } from '../useFloatingDateSeparatorMessageList';
import { VIRTUALIZED_ITEM_DATE_SEPARATOR_SELECTOR } from '../../floatingDateSlot';
import type { RenderedMessage } from '../../../utils';

vi.mock('lodash.throttle', () => ({
  default: <T extends (...args: never[]) => void>(fn: T) => {
    const throttledBase = (...args: Parameters<T>) => fn(...args);
    const throttled = Object.assign(throttledBase, {
      cancel: vi.fn(),
    }) as T & { cancel: () => void };
    return throttled;
  },
}));

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

const makeListElement = () => {
  const listElement = document.createElement('div');

  mockRect(listElement, 100, 500);

  return listElement;
};

const makeSeparator = (date: Date, top: number, bottom: number) => {
  const separator = document.createElement('div');
  separator.className = 'str-chat__date-separator';
  separator.setAttribute('data-date', date.toISOString());
  mockRect(separator, top, bottom);
  return separator;
};

const processedMessages = [{} as RenderedMessage];

describe('useFloatingDateSeparatorMessageList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns hidden state when date separators are disabled', () => {
    const listElement = makeListElement();
    listElement.appendChild(makeSeparator(new Date('2025-01-01T12:00:00Z'), 100, 120));

    const { result } = renderHook(() =>
      useFloatingDateSeparatorMessageList({
        listElement,
        processedMessages,
        withDateSeparator: false,
      }),
    );

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.floatingDate).toBeNull();
  });

  // The list's top edge is at 100px, and each separator is 20px tall.
  const jan1 = new Date('2025-01-01T12:00:00Z');
  const jan2 = new Date('2025-01-02T12:00:00Z');

  const renderWithSeparators = (separators: HTMLElement[]) => {
    const listElement = makeListElement();
    separators.forEach((separator) => listElement.appendChild(separator));

    return renderHook(() =>
      useFloatingDateSeparatorMessageList({
        listElement,
        processedMessages,
        withDateSeparator: true,
      }),
    ).result;
  };

  it('stays hidden at scroll position 0, while the inline separator sits at the top edge', () => {
    const result = renderWithSeparators([makeSeparator(jan1, 100, 120)]);

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.floatingDate).toBeNull();
  });

  it('stays hidden while the inline separator is only partly scrolled out', () => {
    const result = renderWithSeparators([makeSeparator(jan1, 90, 110)]);

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.floatingDate).toBeNull();
  });

  it('shows once the inline separator has fully scrolled out above the top edge', () => {
    const result = renderWithSeparators([makeSeparator(jan1, 80, 100)]);

    expect(result.current.showFloatingDate).toBe(true);
    expect(result.current.floatingDate).toEqual(jan1);
  });

  it('shows the date of the last separator scrolled out above the top edge', () => {
    const result = renderWithSeparators([
      makeSeparator(jan1, 0, 20),
      makeSeparator(jan2, 60, 80),
    ]);

    expect(result.current.showFloatingDate).toBe(true);
    expect(result.current.floatingDate).toEqual(jan2);
  });

  it('stays hidden while the next inline separator overlaps the floating spot', () => {
    const result = renderWithSeparators([
      makeSeparator(jan1, 40, 60),
      makeSeparator(jan2, 110, 130),
    ]);

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.isFloatingSlotTaken).toBe(true);
    expect(result.current.floatingDate).toEqual(jan1);
  });

  it('treats a separator without a date as taking the floating spot', () => {
    const undated = makeSeparator(jan2, 110, 130);
    undated.removeAttribute('data-date');
    const result = renderWithSeparators([makeSeparator(jan1, 40, 60), undated]);

    expect(result.current.isFloatingSlotTaken).toBe(true);
    expect(result.current.showFloatingDate).toBe(false);
  });

  it('shows again once the next inline separator is below the floating spot', () => {
    const result = renderWithSeparators([
      makeSeparator(jan1, 40, 60),
      makeSeparator(jan2, 120, 140),
    ]);

    expect(result.current.showFloatingDate).toBe(true);
    expect(result.current.floatingDate).toEqual(jan1);
  });

  it('takes the date only from separators matching datedSeparatorSelector', () => {
    const listElement = makeListElement();
    // The header separator is the one closest to the top, so only the selector excludes it.
    const header = makeSeparator(jan1, 40, 60);
    const item = document.createElement('div');
    item.setAttribute('data-item-index', '0');
    item.appendChild(makeSeparator(jan2, 0, 20));
    listElement.append(header, item);

    const { result } = renderHook(() =>
      useFloatingDateSeparatorMessageList({
        datedSeparatorSelector: VIRTUALIZED_ITEM_DATE_SEPARATOR_SELECTOR,
        listElement,
        processedMessages,
        withDateSeparator: true,
      }),
    );

    expect(result.current.floatingDate).toEqual(jan2);
  });

  it('counts a separator outside datedSeparatorSelector toward the floating spot', () => {
    const listElement = makeListElement();
    listElement.appendChild(makeSeparator(jan1, 105, 125));

    const { result } = renderHook(() =>
      useFloatingDateSeparatorMessageList({
        datedSeparatorSelector: VIRTUALIZED_ITEM_DATE_SEPARATOR_SELECTOR,
        listElement,
        processedMessages,
        withDateSeparator: true,
      }),
    );

    expect(result.current.isFloatingSlotTaken).toBe(true);
    expect(result.current.floatingDate).toBeNull();
  });

  it('ignores an item wrapper outside the list when picking the date', () => {
    // The list itself sits inside another virtualized list's item.
    const outerItem = document.createElement('div');
    outerItem.setAttribute('data-item-index', '0');
    const listElement = makeListElement();
    outerItem.appendChild(listElement);
    listElement.appendChild(makeSeparator(jan1, 40, 60));

    const { result } = renderHook(() =>
      useFloatingDateSeparatorMessageList({
        datedSeparatorSelector: VIRTUALIZED_ITEM_DATE_SEPARATOR_SELECTOR,
        listElement,
        processedMessages,
        withDateSeparator: true,
      }),
    );

    expect(result.current.floatingDate).toBeNull();
  });

  it('does not count the floating separator toward the floating spot', () => {
    const floating = makeSeparator(jan2, 100, 120);
    floating.classList.add('str-chat__date-separator--floating');
    const result = renderWithSeparators([makeSeparator(jan1, 40, 60), floating]);

    expect(result.current.isFloatingSlotTaken).toBe(false);
    expect(result.current.floatingDate).toEqual(jan1);
  });

  it('stays hidden before the first inline separator reaches the top', () => {
    const result = renderWithSeparators([makeSeparator(jan1, 120, 140)]);

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.floatingDate).toBeNull();
  });
});

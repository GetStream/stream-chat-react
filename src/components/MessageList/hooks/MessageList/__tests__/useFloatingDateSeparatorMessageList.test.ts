import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFloatingDateSeparatorMessageList } from '../useFloatingDateSeparatorMessageList';
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
        disableDateSeparator: true,
        listElement,
        processedMessages,
      }),
    );

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.floatingDate).toBeNull();
  });

  it('uses the separator that reached the top boundary', () => {
    const jan1 = new Date('2025-01-01T12:00:00Z');
    const jan2 = new Date('2025-01-02T12:00:00Z');
    const listElement = makeListElement();

    listElement.appendChild(makeSeparator(jan1, 40, 60));
    listElement.appendChild(makeSeparator(jan2, 100, 120));

    const { result } = renderHook(() =>
      useFloatingDateSeparatorMessageList({
        disableDateSeparator: false,
        listElement,
        processedMessages,
      }),
    );

    expect(result.current.showFloatingDate).toBe(true);
    expect(result.current.floatingDate).toEqual(jan2);
  });

  it('stays hidden before the first inline separator reaches the top', () => {
    const jan1 = new Date('2025-01-01T12:00:00Z');
    const listElement = makeListElement();

    listElement.appendChild(makeSeparator(jan1, 120, 140));

    const { result } = renderHook(() =>
      useFloatingDateSeparatorMessageList({
        disableDateSeparator: false,
        listElement,
        processedMessages,
      }),
    );

    expect(result.current.showFloatingDate).toBe(false);
    expect(result.current.floatingDate).toBeNull();
  });
});

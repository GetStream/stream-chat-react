import { describe, expect, it, vi } from 'vitest';

import { createRovingFocusKeyDownHandler, getNextRovingFocusIndex } from '../a11yUtils';

describe('getNextRovingFocusIndex', () => {
  it('returns null for unsupported keys', () => {
    expect(
      getNextRovingFocusIndex({ activeIndex: 0, itemCount: 3, key: 'Enter' }),
    ).toBeNull();
  });

  it('returns null when there are no items', () => {
    expect(
      getNextRovingFocusIndex({
        activeIndex: -1,
        itemCount: 0,
        key: 'ArrowDown',
      }),
    ).toBeNull();
  });

  it('moves to first/last with Home/End', () => {
    expect(getNextRovingFocusIndex({ activeIndex: 1, itemCount: 4, key: 'Home' })).toBe(
      0,
    );
    expect(getNextRovingFocusIndex({ activeIndex: 1, itemCount: 4, key: 'End' })).toBe(3);
  });

  it('moves forward and backward with wrap-around', () => {
    expect(
      getNextRovingFocusIndex({
        activeIndex: 0,
        itemCount: 3,
        key: 'ArrowUp',
      }),
    ).toBe(2);
    expect(
      getNextRovingFocusIndex({
        activeIndex: 2,
        itemCount: 3,
        key: 'ArrowDown',
      }),
    ).toBe(0);
  });

  it('starts from first/last when no item is focused', () => {
    expect(
      getNextRovingFocusIndex({
        activeIndex: -1,
        itemCount: 3,
        key: 'ArrowDown',
      }),
    ).toBe(0);
    expect(
      getNextRovingFocusIndex({
        activeIndex: -1,
        itemCount: 3,
        key: 'ArrowUp',
      }),
    ).toBe(2);
  });
});

describe('createRovingFocusKeyDownHandler', () => {
  it('supports callback-driven items and custom focus behavior', () => {
    const items = [{ focus: vi.fn() }, { focus: vi.fn() }, { focus: vi.fn() }];
    const preventDefault = vi.fn();
    const focusItem = vi.fn();
    const handler = createRovingFocusKeyDownHandler({
      focusItem,
      getActiveIndex: () => 1,
      getItems: () => items,
    });

    handler({
      currentTarget: document.body,
      key: 'ArrowDown',
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(focusItem).toHaveBeenCalledWith(
      items[2],
      expect.objectContaining({ key: 'ArrowDown' }),
    );
  });

  it('uses default focus handling for focusable elements', () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    const second = document.createElement('button');
    container.append(first, second);
    document.body.append(container);

    first.focus();

    const preventDefault = vi.fn();
    const handler = createRovingFocusKeyDownHandler({
      getItems: () => [first, second],
    });

    handler({
      currentTarget: container,
      key: 'ArrowDown',
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(second).toHaveFocus();

    container.remove();
  });

  it('uses first item when active element cannot map to non-element items', () => {
    const first = { focus: vi.fn() };
    const second = { focus: vi.fn() };
    const preventDefault = vi.fn();
    const handler = createRovingFocusKeyDownHandler({
      getItems: () => [first, second],
    });

    handler({
      currentTarget: document.body,
      key: 'ArrowDown',
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(first.focus).toHaveBeenCalledOnce();
    expect(second.focus).not.toHaveBeenCalled();
  });

  it('ignores non-navigation keys', () => {
    const focusItem = vi.fn();
    const preventDefault = vi.fn();
    const handler = createRovingFocusKeyDownHandler({
      focusItem,
      getItems: () => [{ focus: vi.fn() }],
    });

    handler({
      currentTarget: document.body,
      key: 'Enter',
      preventDefault,
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(focusItem).not.toHaveBeenCalled();
  });
});

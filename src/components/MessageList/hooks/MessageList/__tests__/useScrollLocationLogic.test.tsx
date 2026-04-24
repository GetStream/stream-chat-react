import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { updateScrollTop } = vi.hoisted(() => ({
  updateScrollTop: vi.fn(),
}));

vi.mock('../useMessageListScrollManager', () => ({
  useMessageListScrollManager: vi.fn(() => updateScrollTop),
}));

import { useScrollLocationLogic } from '../useScrollLocationLogic';

describe('useScrollLocationLogic', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('seeds scroll manager with the initial DOM scrollTop', () => {
    const listElement = document.createElement('div');
    listElement.scrollTop = 249;

    renderHook(() =>
      useScrollLocationLogic({
        hasMoreNewer: true,
        listElement,
        loadMoreScrollThreshold: 250,
        messages: [],
        suppressAutoscroll: false,
      }),
    );

    expect(updateScrollTop).toHaveBeenCalledWith(249, null);
  });
});

import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Thread } from 'stream-chat';

import { ThreadProvider } from '../../ThreadContext';
import { useCloseThread } from '../useCloseThread';

const closeThread = vi.fn();
vi.mock('../../../../context', () => ({
  useWorkspaceNavigation: vi.fn(() => ({ closeThread })),
  // The caller renders in the panel beside the primary one.
  useWorkspacePanel: vi.fn(() => 'beside'),
}));

describe('useCloseThread', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('releases the slot of the thread in context', () => {
    const thread = fromPartial<Thread>({ id: 'parent-1' });

    const { result } = renderHook(() => useCloseThread(), {
      wrapper: ({ children }) => (
        <ThreadProvider thread={thread}>{children}</ThreadProvider>
      ),
    });
    result.current();

    expect(closeThread).toHaveBeenCalledWith('parent-1', { panel: 'beside' });
  });

  it('closes the panel without a thread in context', () => {
    const { result } = renderHook(() => useCloseThread());
    result.current();

    expect(closeThread).toHaveBeenCalledWith(undefined, { panel: 'beside' });
  });

  it('lets the caller name another panel', () => {
    const { result } = renderHook(() => useCloseThread());
    result.current({ panel: 'other' });

    expect(closeThread).toHaveBeenCalledWith(undefined, { panel: 'other' });
  });
});

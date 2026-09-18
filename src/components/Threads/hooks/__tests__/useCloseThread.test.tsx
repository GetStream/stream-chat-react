import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Thread } from 'stream-chat';

import { ThreadProvider } from '../../ThreadContext';
import { useCloseThread } from '../useCloseThread';

const closeThread = vi.fn();
vi.mock('../../../../context', () => ({
  useWorkspaceNavigation: vi.fn(() => ({ closeThread })),
}));

describe('useCloseThread', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('releases the slot of the thread in context and deactivates it', () => {
    const deactivate = vi.fn();
    const thread = fromPartial<Thread>({ deactivate, id: 'parent-1' });

    const { result } = renderHook(() => useCloseThread(), {
      wrapper: ({ children }) => (
        <ThreadProvider thread={thread}>{children}</ThreadProvider>
      ),
    });
    result.current();

    expect(closeThread).toHaveBeenCalledWith('parent-1');
    expect(deactivate).toHaveBeenCalledTimes(1);
  });

  it('closes the panel without a thread in context', () => {
    const { result } = renderHook(() => useCloseThread());
    result.current();

    expect(closeThread).toHaveBeenCalledWith(undefined);
  });
});

import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import {
  defaultWorkspaceNavigation,
  useWorkspaceNavigation,
  type WorkspaceNavigation,
  WorkspaceNavigationProvider,
} from '../WorkspaceNavigationContext';

import type { Channel, Thread } from 'stream-chat';

describe('WorkspaceNavigationContext', () => {
  describe('inert no-op default (no provider)', () => {
    it('returns empty reads and false predicates', () => {
      const { result } = renderHook(() => useWorkspaceNavigation());

      expect(result.current.openChannels).toEqual([]);
      expect(result.current.openThreads).toEqual([]);
      expect(result.current.isThreadsView).toBe(false);
      expect(result.current.isChannelActive('messaging:x')).toBe(false);
      expect(result.current.isThreadActive('thread-1')).toBe(false);
      expect(result.current.isThreadDismissable('thread-1')).toBe(false);
    });

    it('makes the operations no-ops that do not throw', () => {
      const { result } = renderHook(() => useWorkspaceNavigation());

      expect(() =>
        result.current.openChannel(fromPartial<Channel>({ cid: 'messaging:x' })),
      ).not.toThrow();
      expect(() =>
        result.current.openThread(fromPartial<Thread>({ id: 'thread-1' })),
      ).not.toThrow();
      expect(() => result.current.closeThread('thread-1')).not.toThrow();
    });
  });

  describe('with a provider', () => {
    it('delegates operations and reads to the provided implementation', () => {
      const openChannel = vi.fn();
      const openThread = vi.fn();
      const closeThread = vi.fn();
      const value: WorkspaceNavigation = {
        ...defaultWorkspaceNavigation,
        closeThread,
        isChannelActive: (cid) => cid === 'messaging:open',
        isThreadsView: true,
        openChannel,
        openThread,
      };
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WorkspaceNavigationProvider value={value}>
          {children}
        </WorkspaceNavigationProvider>
      );

      const { result } = renderHook(() => useWorkspaceNavigation(), { wrapper });

      expect(result.current.isThreadsView).toBe(true);
      expect(result.current.isChannelActive('messaging:open')).toBe(true);
      expect(result.current.isChannelActive('messaging:other')).toBe(false);

      const channel = fromPartial<Channel>({ cid: 'messaging:open' });
      result.current.openChannel(channel);
      result.current.openThread(fromPartial<Thread>({ id: 'thread-1' }));
      result.current.closeThread('thread-1');

      expect(openChannel).toHaveBeenCalledWith(channel);
      expect(openThread).toHaveBeenCalledTimes(1);
      expect(closeThread).toHaveBeenCalledWith('thread-1');
    });
  });
});

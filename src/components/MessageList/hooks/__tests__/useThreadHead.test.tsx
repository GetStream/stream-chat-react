import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from '@stream-io/state-store';
import type { Thread, ThreadState } from 'stream-chat';

import { ComponentProvider } from '../../../../context';
import { ThreadProvider } from '../../../Threads';
import { useThreadHead } from '../useThreadHead';
import { generateMessage, mockComponentContext } from '../../../../mock-builders';

import type { ComponentContextValue } from '../../../../context';

const parentMessage = generateMessage({ id: 'parent-1', reply_count: 2 });

const makeThread = () =>
  fromPartial<Thread>({
    id: parentMessage.id,
    state: new StateStore<ThreadState>(fromPartial<ThreadState>({ parentMessage })),
  });

const renderUseThreadHead = ({
  componentOverrides = {},
  thread,
}: {
  componentOverrides?: Partial<ComponentContextValue>;
  thread?: Thread;
} = {}) =>
  renderHook(() => useThreadHead(), {
    wrapper: ({ children }) => (
      <ComponentProvider value={mockComponentContext({ ...componentOverrides })}>
        <ThreadProvider thread={thread}>{children}</ThreadProvider>
      </ComponentProvider>
    ),
  });

describe('useThreadHead', () => {
  it('returns nothing outside a thread', () => {
    // The channel message list uses the same code path and must not grow a head.
    const { result } = renderUseThreadHead();

    expect(result.current).toBeNull();
  });

  it('renders the thread parent message', () => {
    const { result } = renderUseThreadHead({ thread: makeThread() });

    expect(result.current).toEqual(
      expect.objectContaining({
        key: parentMessage.id,
        props: expect.objectContaining({ message: parentMessage }),
      }),
    );
  });

  it('honors a ThreadHead override from ComponentContext', () => {
    const CustomThreadHead = () => <div />;
    const { result } = renderUseThreadHead({
      componentOverrides: { ThreadHead: CustomThreadHead },
      thread: makeThread(),
    });

    expect(result.current?.type).toBe(CustomThreadHead);
  });
});

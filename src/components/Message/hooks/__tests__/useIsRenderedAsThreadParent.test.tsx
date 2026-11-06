import React from 'react';
import type { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import type { LocalMessage, Thread } from 'stream-chat';

import { useIsRenderedAsThreadParent } from '../useIsRenderedAsThreadParent';
import { MessageProvider } from '../../../../context';
import { ThreadProvider } from '../../../Threads';
import {
  generateMessage,
  initClientWithChannels,
  mockMessageContext,
} from '../../../../mock-builders';

const parentMessage = generateMessage() as LocalMessage;
const reply = generateMessage({ parent_id: parentMessage.id }) as LocalMessage;

const renderUseIsRenderedAsThreadParent = ({
  message,
  thread,
}: {
  message: LocalMessage;
  thread?: Thread;
}) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <ThreadProvider thread={thread}>
      <MessageProvider value={mockMessageContext({ message })}>
        {children}
      </MessageProvider>
    </ThreadProvider>
  );
  return renderHook(() => useIsRenderedAsThreadParent(), { wrapper }).result.current;
};

describe('useIsRenderedAsThreadParent', () => {
  let thread: Thread;

  beforeEach(async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();
    thread = client.threads.ensure({ channel, parentMessage });
  });

  it('is true for the parent message of the thread in context', () => {
    expect(renderUseIsRenderedAsThreadParent({ message: parentMessage, thread })).toBe(
      true,
    );
  });

  it('is false for a reply in the thread', () => {
    expect(renderUseIsRenderedAsThreadParent({ message: reply, thread })).toBe(false);
  });

  it('is false outside a thread, even for a message that has a thread', () => {
    expect(renderUseIsRenderedAsThreadParent({ message: parentMessage })).toBe(false);
  });
});

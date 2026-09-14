import React, { useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

// `../../../context` must be evaluated before the component: they form an import cycle
// (TextareaComposer -> composer hooks -> context), and the other order leaves `useChannel`
// undefined at call time.
import { ChannelInstanceProvider, ChatProvider } from '../../../context';
import { MessageComposerContextProvider } from '../../../context/MessageComposerContext';
import { TextareaComposer } from '../TextareaComposer';
import { ThreadProvider } from '../../Threads/ThreadContext';
import { initClientWithChannels, mockChatContext } from '../../../mock-builders';

import type { Channel, StreamChat, Thread } from 'stream-chat';

/**
 * Opening a different thread focuses its composer.
 *
 * Since `Thread` stopped keying its subtree on the thread, a thread switch swaps the composer in
 * place instead of remounting the textarea, so this no longer rides on a fresh mount. It holds
 * because the focus effect depends on `attachments`, and each composer carries its own array --
 * incidental enough to be worth pinning: make empty attachments a shared constant and focus breaks
 * silently, with nothing else to catch it.
 */
const Harness = ({
  channel,
  client,
  thread,
}: {
  channel: Channel;
  client: StreamChat;
  thread: Thread;
}) => {
  // The real provider owns this ref; the textarea attaches itself to it.
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelInstanceProvider value={{ channel }}>
        <ThreadProvider thread={thread}>
          <MessageComposerContextProvider
            value={fromPartial({ focus: true, textareaRef })}
          >
            <TextareaComposer />
          </MessageComposerContextProvider>
        </ThreadProvider>
      </ChannelInstanceProvider>
    </ChatProvider>
  );
};

const renderTextarea = (props: {
  channel: Channel;
  client: StreamChat;
  thread: Thread;
}) => <Harness {...props} />;

const setup = async () => {
  const {
    channels: [channel, other],
    client,
  } = await initClientWithChannels({
    channelsData: [
      { channel: { id: 'channel-a', type: 'messaging' } },
      { channel: { id: 'channel-b', type: 'messaging' } },
    ],
  });

  // Two threads of the same channel, each with its own composer -- what a thread switch changes.
  const threadA = fromPartial<Thread>({
    id: 'parent-a',
    messageComposer: channel.messageComposer,
  });
  const threadB = fromPartial<Thread>({
    id: 'parent-b',
    messageComposer: other.messageComposer,
  });

  return { channel, client, threadA, threadB };
};

describe('TextareaComposer', () => {
  describe('autofocus', () => {
    it('focuses the textarea when the composer is swapped in place', async () => {
      const { channel, client, threadA, threadB } = await setup();

      const { rerender } = render(renderTextarea({ channel, client, thread: threadA }));
      const textarea = screen.getByTestId('message-input');
      expect(document.activeElement).toBe(textarea);

      // Move focus away, as clicking elsewhere in the app would.
      act(() => (document.activeElement as HTMLElement)?.blur());
      expect(document.activeElement).not.toBe(textarea);

      rerender(renderTextarea({ channel, client, thread: threadB }));

      expect(document.activeElement).toBe(screen.getByTestId('message-input'));
    });

    it('does not steal focus when the same composer re-renders', async () => {
      const { channel, client, threadA } = await setup();

      const { rerender } = render(renderTextarea({ channel, client, thread: threadA }));
      act(() => (document.activeElement as HTMLElement)?.blur());

      rerender(renderTextarea({ channel, client, thread: threadA }));

      expect(document.activeElement).not.toBe(screen.getByTestId('message-input'));
    });
  });
});

import React, { useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

// `../../../context` must be imported before the component: they form an import cycle
// (TextareaComposer -> composer hooks -> context) and the other order leaves `useChannel`
// undefined.
import { ChannelInstanceProvider, ChatProvider } from '../../../context';
import { MessageComposerContextProvider } from '../../../context/MessageComposerContext';
import { TextareaComposer } from '../TextareaComposer';
import { ThreadProvider } from '../../Threads/ThreadContext';
import { initClientWithChannels, mockChatContext } from '../../../mock-builders';

import type { Channel, StreamChat, Thread } from 'stream-chat';

const Harness = ({
  channel,
  client,
  thread,
}: {
  channel: Channel;
  client: StreamChat;
  thread: Thread;
}) => {
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

  // Two threads, each with its own composer.
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
    // A thread switch swaps the composer without remounting the textarea. Focus holds because the
    // focus effect depends on `attachments` and each composer has its own array; a shared
    // constant for empty attachments would break it silently.
    it('focuses the textarea when the composer is swapped in place', async () => {
      const { channel, client, threadA, threadB } = await setup();

      const { rerender } = render(renderTextarea({ channel, client, thread: threadA }));
      const textarea = screen.getByTestId('message-input');
      expect(document.activeElement).toBe(textarea);

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

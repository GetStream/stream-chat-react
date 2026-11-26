import React, { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

// `../../../context` must be imported before the component: they form an import cycle
// (TextareaComposer -> composer hooks -> context) and the other order leaves `useChannel`
// undefined.
import { ChannelInstanceProvider, ChatProvider } from '../../../context';
import { MessageComposerContextProvider } from '../../../context/MessageComposerContext';
import { TextareaComposer } from '../TextareaComposer';
import { ThreadProvider } from '../../Threads/ThreadContext';
import {
  generateMessage,
  generateMessageDraft,
  initClientWithChannels,
  mockChatContext,
} from '../../../mock-builders';
import { usePasteHandler } from '../../MessageComposer/hooks/usePasteHandler';

import type { Channel, StreamChat, Thread } from 'stream-chat';
import type { MessageComposerContextValue } from '../../../context/MessageComposerContext';
import type { TextareaComposerProps } from '../TextareaComposer';

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

  describe('additionalTextareaProps', () => {
    const renderWithContext = async (
      contextValue: Partial<MessageComposerContextValue>,
      props: TextareaComposerProps = {},
    ) => {
      const { channel, client, threadA } = await setup();
      const textareaRef = React.createRef<HTMLTextAreaElement>();
      render(
        <ChatProvider value={mockChatContext({ client })}>
          <ChannelInstanceProvider value={{ channel }}>
            <ThreadProvider thread={threadA}>
              <MessageComposerContextProvider
                value={fromPartial({ textareaRef, ...contextValue })}
              >
                <TextareaComposer {...props} />
              </MessageComposerContextProvider>
            </ThreadProvider>
          </ChannelInstanceProvider>
        </ChatProvider>,
      );
      return screen.getByTestId('message-input');
    };

    it('adds their className next to the own className', async () => {
      const textarea = await renderWithContext(
        { additionalTextareaProps: { className: 'from-composer' } },
        { className: 'from-props' },
      );

      expect(textarea).toHaveClass(
        'str-chat__message-textarea',
        'from-composer',
        'from-props',
      );
    });

    it('calls their onPaste before the default paste handling', async () => {
      const calls: string[] = [];
      const textarea = await renderWithContext({
        additionalTextareaProps: { onPaste: () => calls.push('custom') },
        onPaste: () => calls.push('default'),
      });

      fireEvent.paste(textarea);

      expect(calls).toEqual(['custom', 'default']);
    });

    it('skips the default paste handling when their onPaste prevents the default', async () => {
      const defaultOnPaste = vi.fn();
      const textarea = await renderWithContext({
        additionalTextareaProps: { onPaste: (event) => event.preventDefault() },
        onPaste: defaultOnPaste,
      });

      fireEvent.paste(textarea);

      expect(defaultOnPaste).not.toHaveBeenCalled();
    });

    it('prefers the own onPaste prop over theirs, and still runs the default handling', async () => {
      const composerOnPaste = vi.fn();
      const defaultOnPaste = vi.fn();
      const propOnPaste = vi.fn();
      const textarea = await renderWithContext(
        {
          additionalTextareaProps: { onPaste: composerOnPaste },
          onPaste: defaultOnPaste,
        },
        { onPaste: propOnPaste },
      );

      fireEvent.paste(textarea);

      expect(propOnPaste).toHaveBeenCalledTimes(1);
      expect(composerOnPaste).not.toHaveBeenCalled();
      expect(defaultOnPaste).toHaveBeenCalledTimes(1);
    });
  });

  describe('text the composer does not take', () => {
    it('puts the composer text back once the selection moves', async () => {
      const { channel, client } = await setup();
      const textareaRef = React.createRef<HTMLTextAreaElement>();
      render(
        <ChatProvider value={mockChatContext({ client })}>
          <ChannelInstanceProvider value={{ channel }}>
            <MessageComposerContextProvider value={fromPartial({ textareaRef })}>
              {/* An `onChange` that leaves the composer as it is, like a dropped character. */}
              <TextareaComposer onChange={() => undefined} />
            </MessageComposerContextProvider>
          </ChannelInstanceProvider>
        </ChatProvider>,
      );
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      act(() => {
        channel.messageComposer.textComposer.setText('abcde');
      });

      fireEvent.change(textarea, { target: { value: 'abcdeX' } });
      textarea.setSelectionRange(6, 6);
      fireEvent.select(textarea);

      expect(channel.messageComposer.textComposer.text).toBe('abcde');
      expect(textarea).toHaveValue('abcde');
    });
  });

  // Text the composer sets without typing must be in the textarea before autosize measures it.
  describe('height when the composer sets the text', () => {
    // jsdom has no layout: each line is 20px of scroll height, and autosize reads the box below.
    const ROW_HEIGHT = 20;
    const heightOf = (rows: number) => `${rows * ROW_HEIGHT}px`;
    const threeLines = 'line 1\nline 2\nline 3';
    const fiveLines = 'line 1\nline 2\nline 3\nline 4\nline 5';
    let style: HTMLStyleElement;

    beforeEach(() => {
      style = document.createElement('style');
      style.textContent =
        'textarea { box-sizing: content-box; padding: 0; border: 0 solid; line-height: 20px; }';
      document.head.appendChild(style);
      Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
        configurable: true,
        get(this: HTMLTextAreaElement) {
          return Math.max(1, this.value.split('\n').length) * ROW_HEIGHT;
        },
      });
    });

    afterEach(() => {
      style.remove();
      // Restores jsdom's own getter, inherited from `Element.prototype`.
      delete (HTMLTextAreaElement.prototype as Partial<HTMLTextAreaElement>).scrollHeight;
    });

    const ComposerWithPasteHandling = (props: TextareaComposerProps) => {
      const textareaRef = useRef<HTMLTextAreaElement>(null);
      const { onPaste } = usePasteHandler();
      return (
        <MessageComposerContextProvider value={fromPartial({ onPaste, textareaRef })}>
          <TextareaComposer {...props} />
        </MessageComposerContextProvider>
      );
    };

    const renderComposer = async (minRows?: number) => {
      const { channel, client } = await setup();
      render(
        <ChatProvider value={mockChatContext({ client })}>
          <ChannelInstanceProvider value={{ channel }}>
            <ComposerWithPasteHandling minRows={minRows} />
          </ChannelInstanceProvider>
        </ChatProvider>,
      );
      return { channel, textarea: screen.getByTestId('message-input') };
    };

    describe.each([
      { emptyRows: 1, minRows: undefined },
      { emptyRows: 3, minRows: 3 },
    ])('with minRows $minRows', ({ emptyRows, minRows }) => {
      it('fits a draft restored before the textarea mounts', async () => {
        const { channel, client } = await setup();
        channel.messageComposer.initState({
          composition: generateMessageDraft({
            channel_cid: channel.cid,
            message: generateMessage({ text: fiveLines }),
          }),
        });

        render(
          <ChatProvider value={mockChatContext({ client })}>
            <ChannelInstanceProvider value={{ channel }}>
              <ComposerWithPasteHandling minRows={minRows} />
            </ChannelInstanceProvider>
          </ChatProvider>,
        );

        const textarea = screen.getByTestId('message-input');
        expect(textarea).toHaveValue(fiveLines);
        expect(textarea.style.height).toBe(heightOf(5));
      });

      it('fits a draft restored into the mounted textarea', async () => {
        const { channel, textarea } = await renderComposer(minRows);
        expect(textarea.style.height).toBe(heightOf(emptyRows));

        act(() => {
          channel.messageComposer.initState({
            composition: generateMessageDraft({
              channel_cid: channel.cid,
              message: generateMessage({ text: fiveLines }),
            }),
          });
        });

        expect(textarea).toHaveValue(fiveLines);
        expect(textarea.style.height).toBe(heightOf(5));
      });

      it('fits a multi-line paste inserted by the paste handling', async () => {
        const { textarea } = await renderComposer(minRows);
        expect(textarea.style.height).toBe(heightOf(emptyRows));

        fireEvent.paste(textarea, {
          clipboardData: {
            items: [
              {
                getAsString: (callback: (text: string) => void) => callback(fiveLines),
                kind: 'string',
                type: 'text/plain',
              },
            ],
          },
        });

        await vi.waitFor(() => expect(textarea).toHaveValue(fiveLines));
        expect(textarea.style.height).toBe(heightOf(5));
      });

      it('shrinks back when the text is cleared after sending a multi-line message', async () => {
        const { channel, textarea } = await renderComposer(minRows);
        act(() => {
          channel.messageComposer.textComposer.setText(fiveLines);
        });
        expect(textarea.style.height).toBe(heightOf(5));

        // What the composer does once a message is sent.
        act(() => {
          channel.messageComposer.clear();
        });

        expect(textarea).toHaveValue('');
        expect(textarea.style.height).toBe(heightOf(emptyRows));
      });

      it('fits text set while the textarea already holds other text', async () => {
        const { channel, textarea } = await renderComposer(minRows);
        act(() => {
          channel.messageComposer.textComposer.setText(fiveLines);
        });

        act(() => {
          channel.messageComposer.textComposer.setText(threeLines);
        });

        expect(textarea).toHaveValue(threeLines);
        expect(textarea.style.height).toBe(heightOf(Math.max(3, emptyRows)));
      });
    });
  });
});

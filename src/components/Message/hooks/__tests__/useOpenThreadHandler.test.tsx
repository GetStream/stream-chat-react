import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { useOpenThreadHandler } from '../useOpenThreadHandler';

import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';

// MERGE-RECONCILE (test migration): master's useOpenThreadHandler read `openThread` from the
// deleted ChannelActionContext. It now opens threads through the ChatView navigation
// (`useChatViewNavigation().open`) with a thread binding built from the channel + message. The
// navigation `open` is mocked (there is no ChatView provider in this unit) while the real
// <Chat>/<Channel> providers supply the client and channel. The obsolete "warn if openThread is
// not defined in the channel context" case was dropped — there is no context handler to omit.

const { openMock } = vi.hoisted(() => ({ openMock: vi.fn() }));

vi.mock('../../../ChatView/ChatViewNavigationContext', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../../ChatView/ChatViewNavigationContext')
  >()),
  useChatViewNavigation: () => ({ open: openMock }),
}));

let channel: ChannelType;
let client: StreamChat;

const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

function renderUseOpenThreadHandlerHook(
  message: LocalMessage | null | undefined = generateMessage() as unknown as LocalMessage,
  customOpenThread?: (message: LocalMessage, event: React.BaseSyntheticEvent) => void,
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );

  const { result } = renderHook(
    () => useOpenThreadHandler(message ?? undefined, customOpenThread),
    {
      wrapper,
    },
  );

  return result.current;
}

describe('useOpenThreadHandler custom hook', () => {
  beforeEach(async () => {
    const {
      channels: [ch],
      client: c,
    } = await initClientWithChannels();
    channel = ch;
    client = c;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return a function', () => {
    const handleOpenThread = renderUseOpenThreadHandlerHook();
    expect(typeof handleOpenThread).toBe('function');
  });

  it('should allow user to open a thread', () => {
    const message = generateMessage() as unknown as LocalMessage;
    const handleOpenThread = renderUseOpenThreadHandlerHook(message);
    handleOpenThread(mouseEventMock);
    expect(openMock).toHaveBeenCalledWith(expect.objectContaining({ kind: 'thread' }));
  });

  it('should warn user if it is called without a message', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handleOpenThread = renderUseOpenThreadHandlerHook(null);
    handleOpenThread(mouseEventMock);
    expect(warnSpy).toHaveBeenCalledWith(
      'Open thread handler was called but it is missing one of its parameters',
    );
    expect(openMock).not.toHaveBeenCalled();
  });

  it('should allow user to open a thread with a custom thread handler if one is set', () => {
    const message = generateMessage() as unknown as LocalMessage;
    const customThreadHandler = vi.fn();
    const handleOpenThread = renderUseOpenThreadHandlerHook(message, customThreadHandler);
    handleOpenThread(mouseEventMock);
    expect(customThreadHandler).toHaveBeenCalledWith(message, mouseEventMock);
    expect(openMock).not.toHaveBeenCalled();
  });
});

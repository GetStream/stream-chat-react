import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { missingUseFlagHandlerParameterWarning, useFlagHandler } from '../useFlagHandler';

import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import { Channel } from '../../../Channel';
import { Chat } from '../../../Chat';

// MERGE-RECONCILE (test migration): the master merge removed ChannelStateContext.
// `useFlagHandler` reads the client from ChatContext and flags through
// `client.moderation.flagMessage`.
// The wrapper now uses the real <Chat>/<Channel> providers and assertions spy on
// `client.moderation.flagMessage` instead of stubbing it on a mocked client.

let channel: ChannelType;
let client: StreamChat;

const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

function renderUseHandleFlagHook(message?: LocalMessage) {
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  const { result } = renderHook(() => useFlagHandler(message), {
    wrapper,
  });
  return result.current;
}

describe('useHandleFlag custom hook', () => {
  beforeEach(async () => {
    const {
      channels: [ch],
      client: c,
    } = await initClientWithChannels();
    channel = ch;
    client = c;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate function that handles mutes', async () => {
    const handleFlag = await renderUseHandleFlagHook();
    expect(typeof handleFlag).toBe('function');
  });

  it('should throw a warning when there are missing parameters and the handler is called', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleFlag = await renderUseHandleFlagHook(undefined);
    await handleFlag(mouseEventMock);
    expect(consoleWarnSpy).toHaveBeenCalledWith(missingUseFlagHandlerParameterWarning);
  });

  it('should allow to flag a message when it is successful', async () => {
    const message = generateMessage() as unknown as LocalMessage;
    const flagSpy = vi
      .spyOn(client.moderation, 'flagMessage')
      .mockResolvedValue(fromPartial({}));
    const handleFlag = await renderUseHandleFlagHook(message);
    await handleFlag(mouseEventMock);
    expect(flagSpy).toHaveBeenCalledWith(message.id);
  });

  it('should throw when flagging fails', async () => {
    const message = generateMessage() as unknown as LocalMessage;
    const flagSpy = vi
      .spyOn(client.moderation, 'flagMessage')
      .mockRejectedValue(new Error('flag failed'));
    const handleFlag = await renderUseHandleFlagHook(message);
    await expect(handleFlag(mouseEventMock)).rejects.toThrow('flag failed');
    expect(flagSpy).toHaveBeenCalledWith(message.id);
  });
});

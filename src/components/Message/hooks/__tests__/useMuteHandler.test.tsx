import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { missingUseMuteHandlerParamsWarning, useMuteHandler } from '../useMuteHandler';

import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateMessage,
  generateUser,
  getTestClientWithUser,
  mockChatContext,
} from '../../../../mock-builders';
import type { LocalMessage, MessageResponse, Mute } from 'stream-chat';

// MERGE-RECONCILE (test migration): PR #2909's useMuteHandler no longer reads mutes from the
// removed ChannelStateContext (it reads `client.mutedUsersStore`) and receives `notify` via a
// `notifications` param instead of ChannelActionContext. It also swallows API errors and
// notifies rather than rejecting. Wrapper reduced to <ChatProvider> (the hook does not use a
// channel); mute state is seeded via `client.mutedUsersStore`; failure tests assert `notify`.

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });
const muteUser = vi.fn();
const unmuteUser = vi.fn();
const notify = vi.fn();
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

async function renderUseHandleMuteHook(
  message: LocalMessage | undefined = generateMessage() as MessageResponse & LocalMessage,
  { mutes = [] as Mute[] }: { mutes?: Mute[] } = {},
) {
  const client = await getTestClientWithUser(alice);
  client.muteUser = muteUser;
  client.unmuteUser = unmuteUser;
  client.mutedUsersStore.partialNext({ mutedUsers: mutes });

  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
  );

  const { result } = renderHook(() => useMuteHandler(message, { notify }), {
    wrapper,
  });
  return result.current;
}

describe('useHandleMute custom hook', () => {
  afterEach(vi.clearAllMocks);
  it('should generate function that handles mutes', async () => {
    const handleMute = await renderUseHandleMuteHook();
    expect(typeof handleMute).toBe('function');
  });

  it('should throw a warning when there are missing parameters and the handler is called', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleMute = await renderUseHandleMuteHook(undefined);
    await handleMute(mouseEventMock);
    expect(consoleWarnSpy).toHaveBeenCalledWith(missingUseMuteHandlerParamsWarning);
  });

  it('should allow to mute a user when it is successful', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    const handleMute = await renderUseHandleMuteHook(message);
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
  });

  it('should notify (and not throw) when muting a user fails', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    muteUser.mockImplementationOnce(() => Promise.reject(new Error('mute failed')));
    const handleMute = await renderUseHandleMuteHook(message);
    await expect(handleMute(mouseEventMock)).resolves.toBeUndefined();
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('should allow to unmute a user when it is successful', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    unmuteUser.mockImplementationOnce(() => Promise.resolve());
    const handleMute = await renderUseHandleMuteHook(message, {
      mutes: [fromPartial<Mute>({ target: { id: bob.id } })],
    });
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
  });

  it('should notify (and not throw) when unmuting a user fails', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    unmuteUser.mockImplementationOnce(() => Promise.reject(new Error('unmute failed')));
    const handleMute = await renderUseHandleMuteHook(message, {
      mutes: [fromPartial<Mute>({ target: { id: bob.id } })],
    });
    await expect(handleMute(mouseEventMock)).resolves.toBeUndefined();
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});

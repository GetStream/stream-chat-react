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
import type { LocalMessage, MessageResponse, UserMuteResponse } from 'stream-chat';

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });
// The hook mutes and unmutes through `client.moderation` with `{ target_ids }`.
const mute = vi.fn();
const unmute = vi.fn();
const notify = vi.fn();
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

async function renderUseHandleMuteHook(
  message: LocalMessage | undefined = generateMessage() as MessageResponse & LocalMessage,
  {
    mutes = [] as UserMuteResponse[],
    withNotify = true,
  }: { mutes?: UserMuteResponse[]; withNotify?: boolean } = {},
) {
  const client = await getTestClientWithUser(alice);
  client.moderation.mute = mute;
  client.moderation.unmute = unmute;
  client.mutedUsersStore.partialNext({ mutedUsers: mutes });

  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
  );

  const { result } = renderHook(
    () => useMuteHandler(message, withNotify ? { notify } : {}),
    {
      wrapper,
    },
  );
  return result.current;
}

describe('useHandleMute custom hook', () => {
  afterEach(vi.clearAllMocks);
  it('should generate function that handles mutes', async () => {
    const handleMute = await renderUseHandleMuteHook();
    expect(typeof handleMute).toBe('function');
  });

  it('should throw when there are missing parameters and the handler is called', async () => {
    const handleMute = await renderUseHandleMuteHook(undefined);
    await expect(handleMute(mouseEventMock)).rejects.toThrow(
      missingUseMuteHandlerParamsWarning,
    );
    expect(mute).not.toHaveBeenCalled();
    expect(unmute).not.toHaveBeenCalled();
  });

  it('should allow to mute a user when it is successful', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    const handleMute = await renderUseHandleMuteHook(message);
    await handleMute(mouseEventMock);
    expect(mute).toHaveBeenCalledWith({ target_ids: [bob.id] });
  });

  it('should notify and throw when muting a user fails', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    mute.mockImplementationOnce(() => Promise.reject(new Error('mute failed')));
    const handleMute = await renderUseHandleMuteHook(message);
    await expect(handleMute(mouseEventMock)).rejects.toThrow('mute failed');
    expect(mute).toHaveBeenCalledWith({ target_ids: [bob.id] });
    expect(notify).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('should allow to unmute a user when it is successful', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    unmute.mockImplementationOnce(() => Promise.resolve());
    const handleMute = await renderUseHandleMuteHook(message, {
      mutes: [fromPartial<UserMuteResponse>({ target: { id: bob.id } })],
    });
    await handleMute(mouseEventMock);
    expect(unmute).toHaveBeenCalledWith({ target_ids: [bob.id] });
  });

  it('should notify and throw when unmuting a user fails', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    unmute.mockImplementationOnce(() => Promise.reject(new Error('unmute failed')));
    const handleMute = await renderUseHandleMuteHook(message, {
      mutes: [fromPartial<UserMuteResponse>({ target: { id: bob.id } })],
    });
    await expect(handleMute(mouseEventMock)).rejects.toThrow('unmute failed');
    expect(unmute).toHaveBeenCalledWith({ target_ids: [bob.id] });
    expect(notify).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('should throw when muting a user fails without notifications configured', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    mute.mockImplementationOnce(() => Promise.reject(new Error('mute failed')));
    const handleMute = await renderUseHandleMuteHook(message, { withNotify: false });
    await expect(handleMute(mouseEventMock)).rejects.toThrow('mute failed');
  });

  it('should throw when unmuting a user fails without notifications configured', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    unmute.mockImplementationOnce(() => Promise.reject(new Error('unmute failed')));
    const handleMute = await renderUseHandleMuteHook(message, {
      mutes: [fromPartial<UserMuteResponse>({ target: { id: bob.id } })],
      withNotify: false,
    });
    await expect(handleMute(mouseEventMock)).rejects.toThrow('unmute failed');
  });
});

import React from 'react';
import { renderHook } from '@testing-library/react';

import { useCooldownTimer } from '../useCooldownTimer';

import { ChannelStateProvider, ChatProvider } from '../../../../context';
import { getTestClient } from '../../../../mock-builders';
import { act } from '@testing-library/react';

jest.useFakeTimers();

async function renderUseCooldownTimerHook({ channel, chatContext }) {
  const client = await getTestClient();

  const wrapper = ({ children }) => (
    <ChatProvider value={{ client, ...chatContext }}>
      <ChannelStateProvider value={{ channel }}>{children}</ChannelStateProvider>
    </ChatProvider>
  );
  return renderHook(useCooldownTimer, { wrapper });
}

const cid = 'cid';
const cooldown = 30;
describe('useCooldownTimer', () => {
  it('should set remaining cooldown time to 0 if no channel.cooldown', async () => {
    const channel = { cid };
    const chatContext = { latestMessageDatesByChannels: {} };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to 0 if no channel.cooldown and latest message time is in the future', async () => {
    const channel = { cid };
    const lastSentSecondsAhead = 5;
    const chatContext = {
      latestMessageDatesByChannels: {
        [cid]: new Date(new Date().getTime() + lastSentSecondsAhead * 1000),
      },
    };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to 0 if no channel.cooldown and latest message time is in the past', async () => {
    const channel = { cid };
    const lastSentSecondsAgo = 5;
    const chatContext = {
      latestMessageDatesByChannels: {
        [cid]: new Date(new Date().getTime() - lastSentSecondsAgo * 1000),
      },
    };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to 0 if channel.cooldown is 0', async () => {
    const channel = { cid, data: { cooldown: 0 } };
    const chatContext = { latestMessageDatesByChannels: {} };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to 0 if channel.cooldown is 0 and latest message time is in the future', async () => {
    const channel = { cid, data: { cooldown: 0 } };
    const lastSentSecondsAhead = 5;
    const chatContext = {
      latestMessageDatesByChannels: {
        [cid]: new Date(new Date().getTime() + lastSentSecondsAhead * 1000),
      },
    };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to 0 if channel.cooldown is 0 and latest message time is in the past', async () => {
    const channel = { cid, data: { cooldown: 0 } };
    const lastSentSecondsAgo = 5;
    const chatContext = {
      latestMessageDatesByChannels: {
        [cid]: new Date(new Date().getTime() - lastSentSecondsAgo * 1000),
      },
    };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to 0 if skip-slow-mode is among own_capabilities', async () => {
    const channel = { cid, data: { cooldown, own_capabilities: ['skip-slow-mode'] } };
    const chatContext = { latestMessageDatesByChannels: { [cid]: new Date() } };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to 0 if no previous messages sent', async () => {
    const channel = { cid, data: { cooldown } };
    const chatContext = { latestMessageDatesByChannels: {} };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to 0 if previous messages sent earlier than channel.cooldown', async () => {
    const channel = { cid, data: { cooldown } };
    const chatContext = { latestMessageDatesByChannels: { [cid]: new Date('1970-1-1') } };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });

  it('should set remaining cooldown time to time left from previous messages sent', async () => {
    const channel = { cid, data: { cooldown } };
    const lastSentSecondsAgo = 5;
    const chatContext = {
      latestMessageDatesByChannels: {
        [cid]: new Date(new Date().getTime() - lastSentSecondsAgo * 1000),
      },
    };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(cooldown - lastSentSecondsAgo);
  });

  it('should consider last message with timestamp from future as created now', async () => {
    const channel = { cid, data: { cooldown } };
    const lastSentSecondsAhead = 5;
    const chatContext = {
      latestMessageDatesByChannels: {
        [cid]: new Date(new Date().getTime() + lastSentSecondsAhead * 1000),
      },
    };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(cooldown);
  });

  it('remove the cooldown after the cooldown period elapses', async () => {
    const channel = { cid, data: { cooldown } };
    const chatContext = {
      latestMessageDatesByChannels: {
        [cid]: new Date(),
      },
    };

    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });

    expect(result.current.cooldownRemaining).toBe(cooldown);

    await act(() => {
      jest.advanceTimersByTime(cooldown * 1000);
    });

    expect(result.current.cooldownRemaining).toBe(0);
  });
});

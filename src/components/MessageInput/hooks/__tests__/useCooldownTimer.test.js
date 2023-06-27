import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { useCooldownTimer } from '../useCooldownTimer';

import { ChannelStateProvider, ChatProvider } from '../../../../context';
import { getTestClient } from '../../../../mock-builders';

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
  it('should set remaining cooldown time to if no channel.cooldown', async () => {
    const channel = { cid };
    const chatContext = { latestMessageDatesByChannels: {} };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });
  it('should set remaining cooldown time to 0 if skip-slow-mode is among own_capabilities', async () => {
    const channel = { cid, data: { cooldown, own_capabilities: ['skip-slow-mode'] } };
    const chatContext = { latestMessageDatesByChannels: { cid: new Date() } };
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
    const chatContext = { latestMessageDatesByChannels: { cid: new Date('1970-1-1') } };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(0);
  });
  it('should set remaining cooldown time to time left from previous messages sent', async () => {
    const channel = { cid, data: { cooldown } };
    const lastSentSecondsAgo = 5;
    const chatContext = {
      latestMessageDatesByChannels: {
        cid: new Date(new Date().getTime() - lastSentSecondsAgo * 1000),
      },
    };
    const { result } = await renderUseCooldownTimerHook({ channel, chatContext });
    expect(result.current.cooldownRemaining).toBe(cooldown - lastSentSecondsAgo);
  });
});

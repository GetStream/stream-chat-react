import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { CooldownTimer } from '../CooldownTimer';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { initClientWithChannels } from '../../../mock-builders';
import '@testing-library/jest-dom';

const TIMER_TEST_ID = 'cooldown-timer';

const renderComponent = async ({ channelData = {} } = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [{ channel: channelData }],
  });
  let result;
  await act(() => {
    result = render(
      <Chat client={client}>
        <Channel channel={channel}>
          <CooldownTimer />
        </Channel>
      </Chat>,
    );
  });
  return { channel, ...result };
};

describe('CooldownTimer', () => {
  it('renders CooldownTimer component with 0 when no cooldown active', async () => {
    await renderComponent();
    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent('0');
  });

  it('renders the cooldown remaining value from channel state', async () => {
    const { channel } = await renderComponent();
    await act(() => {
      channel.cooldownTimer.state.next({ cooldownRemaining: 10 });
    });
    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent('10');
  });

  it('updates when cooldown remaining changes', async () => {
    const { channel } = await renderComponent();
    await act(() => {
      channel.cooldownTimer.state.next({ cooldownRemaining: 5 });
    });
    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent('5');

    await act(() => {
      channel.cooldownTimer.state.next({ cooldownRemaining: 3 });
    });
    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent('3');

    await act(() => {
      channel.cooldownTimer.state.next({ cooldownRemaining: 0 });
    });
    expect(screen.getByTestId(TIMER_TEST_ID)).toHaveTextContent('0');
  });
});

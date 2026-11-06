// MessageComposer's send/update hooks import `useChannel` from this root barrel, and a deep
// component import first would re-enter it and leave `useChannel` undefined under Vitest.
import '../../..';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { AIStates } from 'stream-chat';
import type { AIState, Channel as ChannelType, CooldownTimerState } from 'stream-chat';

import { MessageComposer } from '../MessageComposer';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { WithComponents } from '../../../context';
import type { ComponentContextValue } from '../../../context';
import { initClientWithChannels } from '../../../mock-builders';
import { MediaRecorderMock } from '../../../mock-builders/browser';

const STOP_BUTTON_TEST_ID = 'stop-ai-generation-button';
const RECORDING_BUTTON_TEST_ID = 'start-recording-audio-button';
const COOLDOWN_TIMER_TEST_ID = 'cooldown-timer';
const COOLDOWN_SECONDS = 30;

window.MediaRecorder = MediaRecorderMock as unknown as typeof MediaRecorder;

// Renders an empty composer with audio recording enabled, on a channel that allows uploads (which
// a recording needs) and has a cooldown configured. `overrides` go through `WithComponents`.
const renderComposer = async ({
  hideSendButton,
  overrides = {},
}: {
  hideSendButton?: boolean;
  overrides?: Partial<ComponentContextValue>;
} = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [
      { channel: { cooldown: COOLDOWN_SECONDS, own_capabilities: ['upload-file'] } },
    ],
  });
  await act(() => {
    render(
      <WithComponents overrides={overrides}>
        <Chat client={client}>
          <Channel channel={channel}>
            <MessageComposer audioRecordingEnabled hideSendButton={hideSendButton} />
          </Channel>
        </Chat>
      </WithComponents>,
    );
  });
  return channel;
};

const setAIState = (channel: ChannelType, aiState: AIState) =>
  act(() => {
    channel.state.partialNext({ aiState });
  });

const startCooldown = (channel: ChannelType) =>
  act(() => {
    channel.cooldownTimer.state.next(
      fromPartial<CooldownTimerState>({ cooldownRemaining: COOLDOWN_SECONDS }),
    );
  });

describe('MessageComposerActions', () => {
  beforeEach(() => {
    (navigator as any).mediaDevices = { getUserMedia: vi.fn().mockResolvedValue({}) };
  });

  afterEach(() => {
    (navigator as any).mediaDevices = undefined;
  });

  it('shows the recording button for an empty input while the AI is idle', async () => {
    await renderComposer();

    expect(screen.getByTestId(RECORDING_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(STOP_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it.each([AIStates.Thinking, AIStates.Generating])(
    'shows the stop button instead of the recording button for an empty input while the AI state is %s',
    async (aiState) => {
      const channel = await renderComposer();

      await setAIState(channel, aiState);

      expect(screen.getByTestId(STOP_BUTTON_TEST_ID)).toBeInTheDocument();
      expect(screen.queryByTestId(RECORDING_BUTTON_TEST_ID)).not.toBeInTheDocument();
    },
  );

  it('shows the cooldown timer during a cooldown while the AI is idle', async () => {
    const channel = await renderComposer();

    await startCooldown(channel);

    expect(screen.getByTestId(COOLDOWN_TIMER_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(STOP_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it('shows the stop button instead of the cooldown timer while the AI is generating', async () => {
    const channel = await renderComposer();

    await startCooldown(channel);
    await setAIState(channel, AIStates.Generating);

    expect(screen.getByTestId(STOP_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(COOLDOWN_TIMER_TEST_ID)).not.toBeInTheDocument();
  });

  it('shows the stop button while the AI is generating even when the send button is hidden', async () => {
    const channel = await renderComposer({ hideSendButton: true });

    expect(screen.queryByTestId(RECORDING_BUTTON_TEST_ID)).not.toBeInTheDocument();

    await setAIState(channel, AIStates.Generating);

    expect(screen.getByTestId(STOP_BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it('keeps the recording button while the AI is generating when the stop button is removed', async () => {
    const channel = await renderComposer({ overrides: { StopAIGenerationButton: null } });

    await setAIState(channel, AIStates.Generating);

    expect(screen.getByTestId(RECORDING_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(STOP_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it('goes back to the recording button once the AI stops generating', async () => {
    const channel = await renderComposer();

    await setAIState(channel, AIStates.Generating);
    await setAIState(channel, AIStates.Idle);

    expect(screen.getByTestId(RECORDING_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(STOP_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });
});

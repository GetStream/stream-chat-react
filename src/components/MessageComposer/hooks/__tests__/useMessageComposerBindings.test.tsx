import React from 'react';
import { act, renderHook } from '@testing-library/react';

import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import { initClientWithChannels } from '../../../../mock-builders';
import { MediaRecorderMock } from '../../../../mock-builders/browser';
import { useMessageComposerBindings } from '../useMessageComposerBindings';
import type { MessageComposerProps } from '../../MessageComposer';

window.MediaRecorder = MediaRecorderMock as unknown as typeof MediaRecorder;

const renderBindings = async (initialProps: MessageComposerProps) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  let result!: ReturnType<
    typeof renderHook<ReturnType<typeof useMessageComposerBindings>, MessageComposerProps>
  >;
  await act(async () => {
    result = await renderHook((props) => useMessageComposerBindings(props), {
      initialProps,
      wrapper,
    });
  });
  return result;
};

describe('useMessageComposerBindings', () => {
  it('names voice recordings with generateRecordingTitle', async () => {
    const { result } = await renderBindings({
      audioRecordingEnabled: true,
      generateRecordingTitle: (mimeType) => `memo.${mimeType.split('/')[1]}`,
    });

    expect(
      result.current.recordingController.recorder?.generateRecordingTitle('audio/aac'),
    ).toBe('memo.aac');
  });

  it('keeps the recorder when generateRecordingTitle is a new function, and calls the latest one', async () => {
    const { rerender, result } = await renderBindings({
      audioRecordingEnabled: true,
      generateRecordingTitle: () => 'first',
    });
    const recorder = result.current.recordingController.recorder;

    rerender({ audioRecordingEnabled: true, generateRecordingTitle: () => 'second' });

    expect(result.current.recordingController.recorder).toBe(recorder);
    expect(recorder?.generateRecordingTitle('audio/aac')).toBe('second');
  });

  it('falls back to the default title without generateRecordingTitle', async () => {
    const { result } = await renderBindings({ audioRecordingEnabled: true });

    expect(
      result.current.recordingController.recorder?.generateRecordingTitle('audio/aac'),
    ).toMatch(/^audio_recording_.+\.aac$/);
  });

  it('keeps the recorder when audioRecordingConfig is a new object with the same values', async () => {
    const encoder = vi.fn();
    const config = () => ({
      mediaRecorderConfig: { audioBitsPerSecond: 128000 },
      transcoderConfig: { encoder, sampleRate: 16000 },
    });
    const { rerender, result } = await renderBindings({
      audioRecordingConfig: config(),
      audioRecordingEnabled: true,
    });
    const recorder = result.current.recordingController.recorder;

    rerender({ audioRecordingConfig: config(), audioRecordingEnabled: true });

    expect(result.current.recordingController.recorder).toBe(recorder);
  });

  it('creates a new recorder when the audioRecordingConfig values change', async () => {
    const { rerender, result } = await renderBindings({
      audioRecordingConfig: { transcoderConfig: { sampleRate: 16000 } },
      audioRecordingEnabled: true,
    });
    const recorder = result.current.recordingController.recorder;

    rerender({
      audioRecordingConfig: { transcoderConfig: { sampleRate: 44100 } },
      audioRecordingEnabled: true,
    });

    expect(result.current.recordingController.recorder).not.toBe(recorder);
    expect(result.current.recordingController.recorder?.transcoderConfig.sampleRate).toBe(
      44100,
    );
  });

  it('creates a new recorder when a function in audioRecordingConfig changes identity', async () => {
    const { rerender, result } = await renderBindings({
      audioRecordingConfig: { transcoderConfig: { encoder: vi.fn(), sampleRate: 16000 } },
      audioRecordingEnabled: true,
    });
    const recorder = result.current.recordingController.recorder;

    rerender({
      audioRecordingConfig: { transcoderConfig: { encoder: vi.fn(), sampleRate: 16000 } },
      audioRecordingEnabled: true,
    });

    expect(result.current.recordingController.recorder).not.toBe(recorder);
  });
});

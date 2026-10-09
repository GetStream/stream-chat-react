import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { AIMessageComposer, useSpeechToText } from '..';
import type { UseSpeechToTextOptions } from '..';
import {
  installFakeSpeechRecognition,
  latestRecognition,
  uninstallFakeSpeechRecognition,
} from './fakeSpeechRecognition';

const BUTTON_LABEL = 'aria/Start voice input';

const Composer = ({ options }: { options?: UseSpeechToTextOptions }) => (
  <AIMessageComposer>
    <AIMessageComposer.TextInput aria-label='message' />
    <AIMessageComposer.SpeechToTextButton options={options} />
  </AIMessageComposer>
);

describe('AIMessageComposer.SpeechToTextButton', () => {
  afterEach(() => {
    uninstallFakeSpeechRecognition();
    vi.restoreAllMocks();
  });

  it('renders nothing when the Web Speech API is unavailable', () => {
    expect('SpeechRecognition' in window).toBe(false);
    expect('webkitSpeechRecognition' in window).toBe(false);
    render(<Composer />);
    expect(screen.queryByLabelText(BUTTON_LABEL)).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  describe('with the Web Speech API', () => {
    beforeEach(() => {
      installFakeSpeechRecognition();
    });

    it('forwards options to the recognizer and does not leak them to the DOM', () => {
      render(
        <Composer options={{ continuous: true, interimResults: false, lang: 'de-DE' }} />,
      );
      const button = screen.getByLabelText(BUTTON_LABEL);
      expect(button).not.toHaveAttribute('options');

      const recognition = latestRecognition();
      expect(recognition.lang).toBe('de-DE');
      expect(recognition.continuous).toBe(true);
      expect(recognition.interimResults).toBe(false);
    });

    it('writes the transcript to the composer and calls the consumer onTranscript', () => {
      const onTranscript = vi.fn();
      render(<Composer options={{ onTranscript }} />);

      fireEvent.click(screen.getByLabelText(BUTTON_LABEL));
      expect(latestRecognition().start).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText(BUTTON_LABEL)).toHaveAttribute('aria-pressed', 'true');

      act(() => latestRecognition().emitTranscript('hello there'));
      expect(onTranscript).toHaveBeenCalledWith('hello there');
      expect(screen.getByLabelText('message')).toHaveValue('hello there');
    });

    it('routes errors to the consumer onError instead of the console', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const onError = vi.fn();
      render(<Composer options={{ onError }} />);

      act(() => latestRecognition().emitError('not-allowed'));
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Microphone access'));
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('logs errors to the console when no onError is given', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      render(<Composer />);

      act(() => latestRecognition().emitError('network'));
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Network'));
    });

    it('keeps one recognizer across re-renders with new inline callbacks', () => {
      const { rerender } = render(<Composer options={{ onTranscript: () => 1 }} />);
      const first = latestRecognition();
      rerender(<Composer options={{ onTranscript: () => 2 }} />);
      rerender(<Composer options={{ onTranscript: () => 3 }} />);
      expect(latestRecognition()).toBe(first);
      expect(first.stop).not.toHaveBeenCalled();
    });
  });

  it('useSpeechToText keeps one recognizer when given new inline callbacks', () => {
    installFakeSpeechRecognition();
    const calls: string[] = [];
    const { rerender } = renderHook(
      ({ tag }: { tag: string }) =>
        useSpeechToText({ onTranscript: (text) => calls.push(`${tag}:${text}`) }),
      { initialProps: { tag: 'a' } },
    );
    const first = latestRecognition();
    rerender({ tag: 'b' });
    expect(latestRecognition()).toBe(first);
    expect(first.stop).not.toHaveBeenCalled();

    // the latest callback is still the one invoked
    act(() => first.emitTranscript('hi'));
    expect(calls).toEqual(['b:hi']);
  });
});

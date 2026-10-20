import React from 'react';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';

import { AIMessageComposer, VoiceGlow, VoiceWave } from '..';
import {
  installFakeSpeechRecognition,
  uninstallFakeSpeechRecognition,
} from './fakeSpeechRecognition';

const Tree = () => (
  <AIMessageComposer>
    <AIMessageComposer.FileInput name='attachments' />
    <AIMessageComposer.TextInput />
    <AIMessageComposer.SpeechToTextButton />
    <AIMessageComposer.SubmitButton />
  </AIMessageComposer>
);

describe('AIMessageComposer hydration', () => {
  afterEach(() => {
    uninstallFakeSpeechRecognition();
    vi.restoreAllMocks();
  });

  it('hydrates server markup without mismatches', () => {
    installFakeSpeechRecognition();
    const html = renderToString(<Tree />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const serverId = container.querySelector('input[type="file"]')?.id;

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onRecoverableError = vi.fn();
    act(() => {
      hydrateRoot(container, <Tree />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput.id).toBe(serverId);
    expect(container.querySelector(`label[for="${serverId}"]`)).toBeInTheDocument();
    // the speech button appears only after hydration (support is browser-only)
    expect(container.querySelector('button[aria-pressed]')).toBeInTheDocument();
    container.remove();
  });
});

describe('VoiceWave and VoiceGlow hydration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates server markup without mismatches', () => {
    const VoiceTree = () => (
      <>
        <VoiceWave state='speaking' />
        <VoiceGlow state='listening' />
      </>
    );
    const html = renderToString(<VoiceTree />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const serverCanvases = Array.from(container.querySelectorAll('canvas'));

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onRecoverableError = vi.fn();
    act(() => {
      hydrateRoot(container, <VoiceTree />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    // The wave keeps its server canvas; the glow may swap its canvas for a Canvas fallback.
    expect(container.querySelector('.str-chat__ai-voice-wave canvas')).toBe(
      serverCanvases[0],
    );
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(2);
    container.remove();
  });
});

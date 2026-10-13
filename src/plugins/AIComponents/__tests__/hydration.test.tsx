import React from 'react';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';

import { AIMessageComposer } from '..';
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

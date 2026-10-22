import React from 'react';
import { render, screen } from '@testing-library/react';

import { AIMessageComposer, AIStateIndicator, VoiceGlow, VoiceWave } from '..';
import { TranslationProvider } from '../../../context';
import en from '../../../i18n/en.json';
import {
  installFakeSpeechRecognition,
  uninstallFakeSpeechRecognition,
} from './fakeSpeechRecognition';

const t = ((key: string) => `T:${key}`) as never;

describe('AI components i18n', () => {
  beforeEach(() => {
    installFakeSpeechRecognition();
  });
  afterEach(() => {
    uninstallFakeSpeechRecognition();
  });

  it('translates the composer placeholder', () => {
    render(
      <TranslationProvider
        value={{ t, tDateTimeParser: (() => null) as never, userLanguage: 'en' }}
      >
        <AIMessageComposer>
          <AIMessageComposer.TextInput />
        </AIMessageComposer>
      </TranslationProvider>,
    );
    expect(screen.getByPlaceholderText('T:Ask a question...')).toBeInTheDocument();
  });

  it('translates state indicator messages', () => {
    const { container } = render(
      <TranslationProvider
        value={{ t, tDateTimeParser: (() => null) as never, userLanguage: 'en' }}
      >
        <AIStateIndicator />
      </TranslationProvider>,
    );
    expect(container.textContent).toMatch(/^T:/);
  });

  it('translates the voice visualization names and states', () => {
    const translate = vi.fn(
      (key: string, options?: { state?: string }) =>
        `T:${key}${options?.state ? `|${options.state}` : ''}`,
    );
    render(
      <TranslationProvider
        value={{
          t: translate as never,
          tDateTimeParser: (() => null) as never,
          userLanguage: 'en',
        }}
      >
        <VoiceWave state='speaking' />
        <VoiceGlow state='idle' />
      </TranslationProvider>,
    );
    expect(
      screen.getByRole('img', { name: 'T:aria/Voice agent: {{ state }}|T:Speaking' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'T:aria/Voice agent: {{ state }}|T:Ready' }),
    ).toBeInTheDocument();
  });

  it('renders real English values for aria keys (no aria/ prefix)', () => {
    const enT = ((key: string) => (en as Record<string, string>)[key] ?? key) as never;
    render(
      <TranslationProvider
        value={{ t: enT, tDateTimeParser: (() => null) as never, userLanguage: 'en' }}
      >
        <AIMessageComposer>
          <AIMessageComposer.SpeechToTextButton />
        </AIMessageComposer>
      </TranslationProvider>,
    );
    expect(screen.getByLabelText('Start voice input')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { AIMessageComposer, AIStateIndicator } from '..';
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

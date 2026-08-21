import { render, screen } from '@testing-library/react';
import React from 'react';

import { MessageProvider, TranslationProvider } from '../../../context';
import { Streami18n } from '../../../i18n/Streami18n';
import type { StreamTFunction } from '../../../i18n/types';
import { mockMessageContext } from '../../../mock-builders';
import { MessageTranslationIndicator } from '../MessageTranslationIndicator';

/**
 * Rendered against a real `Streami18n`, not a mocked `t`.
 *
 * The behaviour under test is what i18next does with a `language.*` key it has no entry for, so a mock
 * that echoes the default back would pass either way.
 */
const renderIndicator = async (sourceLanguage: string) => {
  const i18n = new Streami18n({ logger: () => {} });
  const { t, tDateTimeParser } = await i18n.init();

  const message = {
    i18n: { en_text: 'Hello', language: sourceLanguage },
    text: 'source text',
    type: 'regular',
  };

  render(
    <TranslationProvider
      value={{ t: t as StreamTFunction, tDateTimeParser, userLanguage: 'en' }}
    >
      <MessageProvider
        value={mockMessageContext({
          message,
          setTranslationView: () => {},
          translationView: 'translated',
        })}
      >
        <MessageTranslationIndicator />
      </MessageProvider>
    </TranslationProvider>,
  );
};

describe('MessageTranslationIndicator', () => {
  it('names a language core has a display name for', async () => {
    await renderIndicator('de');

    expect(screen.getByText('Translated from German')).toBeInTheDocument();
  });

  /**
   * `message.i18n.language` is server data; the `language.*` catalog is generated when the SDK is built.
   * A language the translation API learns after this release therefore has no entry, and i18next echoes
   * the key back — so without the miss-detection this rendered "Translated from language.xx".
   */
  it('falls back to the bare code for a language it has no name for', async () => {
    await renderIndicator('xx');

    expect(screen.getByText('Translated from xx')).toBeInTheDocument();
    expect(screen.queryByText(/language\.xx/)).not.toBeInTheDocument();
  });
});

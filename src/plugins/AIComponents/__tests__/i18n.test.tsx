import React from 'react';
import { render, screen } from '@testing-library/react';

import { AIMessageComposer, AIStateIndicator } from '..';
import { TranslationProvider } from '../../../context';

const t = ((key: string) => `T:${key}`) as never;

describe('AI components i18n', () => {
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
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import type { Attachment } from 'stream-chat';

import { UnsupportedAttachment } from '../UnsupportedAttachment';
import { ComponentProvider } from '../../../context/ComponentContext';
import { TranslationProvider } from '../../../context';
import {
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

const renderUnsupported = (
  attachment: Attachment,
  componentOverrides: Record<string, unknown> = {},
) =>
  render(
    <TranslationProvider value={mockTranslationContextValue()}>
      <ComponentProvider value={mockComponentContext(componentOverrides)}>
        <UnsupportedAttachment attachment={attachment} />
      </ComponentProvider>
    </TranslationProvider>,
  );

describe('UnsupportedAttachment', () => {
  it('renders translated label when title is set', () => {
    renderUnsupported({
      mime_type: 'application/x-custom',
      title: 'Custom payload',
      type: 'unknown',
    } as Attachment);

    expect(screen.getByTestId('unsupported-attachment-title')).toHaveTextContent(
      'Unsupported attachment',
    );
  });

  it('falls back to translated label when title is missing', () => {
    renderUnsupported({ type: 'weird' } as Attachment);

    expect(screen.getByTestId('unsupported-attachment-title')).toHaveTextContent(
      'Unsupported attachment',
    );
  });

  it('renders default unsupported icon', () => {
    renderUnsupported({
      mime_type: 'application/octet-stream',
      title: 'data.bin',
      type: 'file',
    } as Attachment);

    expect(
      document.querySelector('.str-chat__icon--unsupported-attachment'),
    ).toBeTruthy();
  });
});

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
import type { FileIconProps } from '../../FileIcon/FileIcon';

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
  it('renders attachment title when title is set', () => {
    renderUnsupported({
      mime_type: 'application/x-custom',
      title: 'Custom payload',
      type: 'unknown',
    } as Attachment);

    expect(screen.getByTestId('unsupported-attachment-title')).toHaveTextContent(
      'Custom payload',
    );
  });

  it('falls back to translated label when title is missing', () => {
    renderUnsupported({ type: 'weird' } as Attachment);

    expect(screen.getByTestId('unsupported-attachment-title')).toHaveTextContent(
      'Unsupported attachment',
    );
  });

  it('uses AttachmentFileIcon from context when provided', () => {
    const CustomAttachmentFileIcon = ({ fileName, mimeType }: FileIconProps) => (
      <span
        data-file-name={fileName}
        data-mime-type={mimeType}
        data-testid='custom-attachment-file-icon'
      />
    );

    renderUnsupported(
      {
        mime_type: 'application/octet-stream',
        title: 'data.bin',
        type: 'file',
      } as Attachment,
      { AttachmentFileIcon: CustomAttachmentFileIcon },
    );

    const icon = screen.getByTestId('custom-attachment-file-icon');
    expect(icon).toHaveAttribute('data-file-name', 'data.bin');
    expect(icon).toHaveAttribute('data-mime-type', 'application/octet-stream');
  });
});

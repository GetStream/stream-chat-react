import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from '../../../../../../axe-helper';
import { AttachmentPreviewRoot } from '../AttachmentPreviewRoot';

const attachment = {
  asset_url: 'https://example.com/video.mp4',
  localMetadata: {
    id: 'attachment-id',
    previewUri: 'image-preview-uri',
  },
  type: 'video',
};

describe('AttachmentPreviewRoot', () => {
  it('adds button semantics when interactive and handles Enter/Space', () => {
    const openPreview = vi.fn();

    render(
      <AttachmentPreviewRoot attachment={attachment} openPreview={openPreview}>
        <span>Attachment preview</span>
      </AttachmentPreviewRoot>,
    );

    const root = screen.getByRole('button');
    expect(root).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(root, { key: 'Enter' });
    fireEvent.keyDown(root, { key: ' ' });

    expect(openPreview).toHaveBeenCalledTimes(2);
  });

  it('is not focusable when not interactive', () => {
    render(
      <AttachmentPreviewRoot
        attachment={attachment}
        data-testid='attachment-preview-root'
      >
        <span>Attachment preview</span>
      </AttachmentPreviewRoot>,
    );

    const root = screen.getByTestId('attachment-preview-root');
    expect(root).not.toHaveAttribute('role');
    expect(root).toHaveAttribute('tabindex', '-1');
  });

  it('passes axe when interactive', async () => {
    const { container } = render(
      <AttachmentPreviewRoot attachment={attachment} openPreview={vi.fn()}>
        <span>Attachment preview</span>
      </AttachmentPreviewRoot>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

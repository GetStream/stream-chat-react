import React from 'react';
import { render, screen } from '@testing-library/react';
import { AttachmentUploadedSizeIndicator } from '../AttachmentPreviewList/AttachmentUploadedSizeIndicator';

describe('AttachmentUploadedSizeIndicator', () => {
  it('renders nothing when upload state is not uploading or finished', () => {
    const { container } = render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          file_size: 100,
          localMetadata: { uploadState: 'failed' },
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when uploading without uploadProgress', () => {
    const { container } = render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          file_size: 1000,
          localMetadata: { uploadState: 'uploading' },
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when uploading without a resolvable full byte size', () => {
    const { container } = render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          localMetadata: {
            uploadProgress: 50,
            uploadState: 'uploading',
          },
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders upload size fraction when uploading with numeric file_size and progress', () => {
    render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          file_size: 1000,
          localMetadata: {
            uploadProgress: 50,
            uploadState: 'uploading',
          },
        }}
      />,
    );

    expect(screen.getByTestId('upload-size-fraction')).toHaveTextContent(
      '500 B / 1.00e+3 B',
    );
    expect(screen.getByTestId('upload-size-fraction')).toHaveClass(
      'str-chat__attachment-preview-file__upload-size-fraction',
    );
  });

  it('parses string file_size for the upload fraction', () => {
    render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          file_size: '1000',
          localMetadata: {
            uploadProgress: 50,
            uploadState: 'uploading',
          },
        }}
      />,
    );

    expect(screen.getByTestId('upload-size-fraction')).toHaveTextContent(
      '500 B / 1.00e+3 B',
    );
  });

  it('prefers localMetadata.file.size over file_size when both are present', () => {
    render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          file_size: 1000,
          localMetadata: {
            file: { size: 200 },
            uploadProgress: 50,
            uploadState: 'uploading',
          },
        }}
      />,
    );

    expect(screen.getByTestId('upload-size-fraction')).toHaveTextContent('100 B / 200 B');
  });

  it('renders FileSizeIndicator when upload is finished', () => {
    render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          file_size: 1024,
          localMetadata: { uploadState: 'finished' },
        }}
      />,
    );

    expect(screen.getByTestId('file-size-indicator')).toHaveTextContent('1.00 kB');
  });

  it('renders nothing when finished but file_size is missing or invalid', () => {
    const { container: missing } = render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          localMetadata: { uploadState: 'finished' },
        }}
      />,
    );
    expect(missing.firstChild).toBeNull();

    const { container: nanString } = render(
      <AttachmentUploadedSizeIndicator
        attachment={{
          file_size: 'not-a-number',
          localMetadata: { uploadState: 'finished' },
        }}
      />,
    );
    expect(nanString.firstChild).toBeNull();
  });
});

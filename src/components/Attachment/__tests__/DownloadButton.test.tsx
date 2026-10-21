import React from 'react';
import { render, screen } from '@testing-library/react';

import { DownloadButton } from '../components/DownloadButton';

describe('DownloadButton', () => {
  it('links to a safe asset URL', () => {
    render(<DownloadButton assetUrl='https://example.com/file.mp3' />);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://example.com/file.mp3',
    );
  });

  it.each([undefined, ''])('renders nothing for the asset URL %j', (assetUrl) => {
    const { container } = render(<DownloadButton assetUrl={assetUrl} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an unsafe asset URL', () => {
    // eslint-disable-next-line no-script-url
    const { container } = render(<DownloadButton assetUrl='javascript:alert(1)' />);

    expect(container).toBeEmptyDOMElement();
  });
});

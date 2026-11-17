import React from 'react';
import { render, screen } from '@testing-library/react';

import { WithComponents } from '../../../context';
import { VideoThumbnail } from '../VideoThumbnail';

describe('VideoThumbnail', () => {
  it('renders the BaseImage from ComponentContext with the image props', () => {
    const CustomBaseImage = ({
      className,
      src,
    }: {
      className?: string;
      src?: string;
    }) => <div className={className} data-src={src} data-testid='custom-base-image' />;

    render(
      <WithComponents overrides={{ BaseImage: CustomBaseImage }}>
        <VideoThumbnail className='custom-class' src='https://example.com/thumb.png' />
      </WithComponents>,
    );

    const image = screen.getByTestId('custom-base-image');
    expect(image).toHaveAttribute('data-src', 'https://example.com/thumb.png');
    expect(image).toHaveClass(
      'str-chat__message-attachment__video-thumbnail-image',
      'custom-class',
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

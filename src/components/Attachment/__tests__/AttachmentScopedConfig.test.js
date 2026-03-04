import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  generateGiphyAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders';
import { Attachment } from '../Attachment';
import { useAttachmentContext } from '../AttachmentContext';

const TestImage = React.forwardRef(({ imageUrl }, ref) => (
  <img data-testid='resized-image' data-url={imageUrl} ref={ref} />
));
TestImage.displayName = 'TestImage';

const TestVideoPlayer = ({ isPlaying, thumbnailUrl, videoUrl }) => (
  <div
    data-playing={String(Boolean(isPlaying))}
    data-testid='video-player'
    data-thumbnail={thumbnailUrl ?? ''}
    data-video={videoUrl ?? ''}
  />
);

const ContextAwareGiphy = () => {
  const { giphyVersion } = useAttachmentContext();
  return <div data-testid='giphy-version'>{giphyVersion}</div>;
};

describe('Attachment scoped media config', () => {
  it('uses giphyVersion from attachment scope', () => {
    const attachment = generateGiphyAttachment();

    render(
      <Attachment
        attachments={[attachment]}
        Giphy={ContextAwareGiphy}
        giphyVersion='original'
      />,
    );

    expect(screen.getByTestId('giphy-version')).toHaveTextContent('original');
  });

  it('uses imageAttachmentSizeHandler from Attachment props without ChannelStateContext fields', async () => {
    const resizedUrl = 'https://example.com/resized-image.jpg';
    const imageAttachmentSizeHandler = jest.fn(() => ({ url: resizedUrl }));
    const attachment = generateImageAttachment({
      image_url: 'https://example.com/original-image.jpg',
    });

    render(
      <Attachment
        attachments={[attachment]}
        Image={TestImage}
        imageAttachmentSizeHandler={imageAttachmentSizeHandler}
      />,
    );

    await waitFor(() => {
      expect(imageAttachmentSizeHandler).toHaveBeenCalled();
    });
    expect(screen.getByTestId('resized-image')).toHaveAttribute('data-url', resizedUrl);
  });

  it('uses shouldGenerateVideoThumbnail and videoAttachmentSizeHandler from Attachment props', async () => {
    const resizedVideoUrl = 'https://example.com/video-resized.mp4';
    const resizedThumbUrl = 'https://example.com/thumb-resized.jpg';
    const videoAttachmentSizeHandler = jest.fn(() => ({
      thumbUrl: resizedThumbUrl,
      url: resizedVideoUrl,
    }));
    const attachment = generateVideoAttachment({
      asset_url: 'https://example.com/video-original.mp4',
      thumb_url: 'https://example.com/thumb-original.jpg',
    });

    render(
      <Attachment
        attachments={[attachment]}
        Media={TestVideoPlayer}
        shouldGenerateVideoThumbnail={false}
        videoAttachmentSizeHandler={videoAttachmentSizeHandler}
      />,
    );

    await waitFor(() => {
      expect(videoAttachmentSizeHandler).toHaveBeenCalled();
    });

    expect(videoAttachmentSizeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ asset_url: attachment.asset_url }),
      expect.any(HTMLDivElement),
      false,
    );
    expect(screen.queryByTestId('image-test')).not.toBeInTheDocument();
    expect(screen.getByTestId('video-player')).toHaveAttribute(
      'data-video',
      resizedVideoUrl,
    );
  });
});

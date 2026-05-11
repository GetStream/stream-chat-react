import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import type { VideoAttachment as StreamVideoAttachment } from 'stream-chat';
import { vi } from 'vitest';

import { VideoAttachment } from '../VideoAttachment';
import {
  ChannelStateProvider,
  ComponentProvider,
  TranslationProvider,
} from '../../../context';
import {
  mockChannelStateContext,
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

const CustomVideoPlayer = ({
  thumbnailUrl,
  videoUrl,
}: {
  thumbnailUrl?: string;
  videoUrl?: string;
}) => (
  <div data-testid='custom-video-player'>
    <span data-testid='video-player-thumbnail'>{thumbnailUrl}</span>
    <span data-testid='video-player-url'>{videoUrl}</span>
  </div>
);

const renderComponent = ({
  shouldGenerateVideoThumbnail = true,
}: {
  shouldGenerateVideoThumbnail?: boolean;
} = {}) => {
  const attachment: StreamVideoAttachment = {
    asset_url: 'https://example.com/clip.mp4',
    file_size: 2930530,
    mime_type: 'video/mp4',
    thumb_url: 'https://example.com/clip.mp4',
    title: 'clip.mp4',
    type: 'video',
  };
  const videoAttachmentSizeHandler = vi.fn(() => ({
    thumbUrl: attachment.thumb_url,
    url: attachment.asset_url,
  }));

  render(
    <TranslationProvider value={mockTranslationContextValue()}>
      <ComponentProvider value={mockComponentContext({ VideoPlayer: CustomVideoPlayer })}>
        <ChannelStateProvider
          value={mockChannelStateContext({
            shouldGenerateVideoThumbnail,
            videoAttachmentSizeHandler,
          })}
        >
          <VideoAttachment attachment={attachment} />
        </ChannelStateProvider>
      </ComponentProvider>
    </TranslationProvider>,
  );

  return { attachment, videoAttachmentSizeHandler };
};

describe('VideoAttachment', () => {
  it('renders the video player directly when thumbnail generation is disabled', async () => {
    const { attachment, videoAttachmentSizeHandler } = renderComponent({
      shouldGenerateVideoThumbnail: false,
    });

    await waitFor(() => {
      expect(screen.getByTestId('custom-video-player')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('image-test')).not.toBeInTheDocument();
    expect(screen.getByTestId('video-player-thumbnail')).toHaveTextContent(
      attachment.thumb_url,
    );
    expect(screen.getByTestId('video-player-url')).toHaveTextContent(
      attachment.asset_url,
    );
    expect(videoAttachmentSizeHandler).toHaveBeenCalledWith(
      attachment,
      expect.any(HTMLDivElement),
      false,
    );
  });

  it('renders the thumbnail first when thumbnail generation is enabled', async () => {
    const { attachment, videoAttachmentSizeHandler } = renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('image-test')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('custom-video-player')).not.toBeInTheDocument();
    expect(videoAttachmentSizeHandler).toHaveBeenCalledWith(
      attachment,
      expect.any(HTMLDivElement),
      true,
    );
  });
});

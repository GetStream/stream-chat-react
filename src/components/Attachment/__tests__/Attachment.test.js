/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable sonarjs/no-duplicate-string */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { v4 as uuidv4 } from 'uuid';

import {
  generateImageAttachment,
  generateAudioAttachment,
  generateFileAttachment,
  generateImgurAttachment,
  generateGiphyAttachment,
  generateVideoAttachment,
  generateAttachmentAction,
  generateCardAttachment,
} from 'mock-builders';

import Attachment, { SUPPORTED_VIDEO_FORMATS } from '../Attachment';

const Audio = () => <div data-testid="audio-attachment"></div>;
const Card = () => <div data-testid="card-attachment"></div>;
const Media = () => <div data-testid="media-attachment"></div>;
const AttachmentActions = () => <div data-testid="attachment-actions"></div>;
const Image = () => <div data-testid="image-attachment"></div>;
const File = () => <div data-testid="file-attachment"></div>;

const getAttachmentComponent = (props) => {
  return (
    <Attachment
      Audio={Audio}
      Card={Card}
      Media={Media}
      AttachmentActions={AttachmentActions}
      Image={Image}
      File={File}
      {...props}
    />
  );
};

describe('Attachment', () => {
  it('should render Audio component for "audio" type attachment', async () => {
    const attachment = generateAudioAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));
    await waitFor(() => {
      expect(getByTestId('audio-attachment')).toBeInTheDocument();
    });
  });
  it('should render File component for "file" type attachment', async () => {
    const attachment = generateFileAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));
    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeInTheDocument();
    });
  });
  it('should render Card component for "imgur" type attachment', async () => {
    const attachment = generateImgurAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));
    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeInTheDocument();
    });
  });
  it('should render Card component for "giphy" type attachment', async () => {
    const attachment = generateGiphyAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));
    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeInTheDocument();
    });
  });
  describe('image type attachment', () => {
    it('should render Card component if attachment has title_link or og_scrape_url', async () => {
      const attachment = generateImageAttachment();
      const { getByTestId } = render(getAttachmentComponent({ attachment }));
      await waitFor(() => {
        expect(getByTestId('card-attachment')).toBeInTheDocument();
      });
    });
    it('should otherwise render Image component', async () => {
      const attachment = generateImageAttachment({
        title_link: undefined,
        og_scrape_url: undefined,
      });
      const { getByTestId } = render(getAttachmentComponent({ attachment }));
      await waitFor(() => {
        expect(getByTestId('image-attachment')).toBeInTheDocument();
      });
    });
    it('should render AttachmentActions component if attachment has actions', async () => {
      const attachment = generateImageAttachment({
        actions: [generateAttachmentAction(), generateAttachmentAction()],
      });
      const { getByTestId } = render(getAttachmentComponent({ attachment }));
      await waitFor(() => {
        expect(getByTestId('attachment-actions')).toBeInTheDocument();
      });
    });
  });
  describe('video type attachment', () => {
    it.each(SUPPORTED_VIDEO_FORMATS.map((f) => [f]))(
      'should render Media component for video of %s mime-type attachment',
      async (mime_type) => {
        const attachment = generateVideoAttachment({ mime_type });
        const { getByTestId } = render(getAttachmentComponent({ attachment }));
        await waitFor(() => {
          expect(getByTestId('media-attachment')).toBeInTheDocument();
        });
      },
    );
    it('should render video player if video type is video', async () => {
      const attachment = generateVideoAttachment({
        asset_url: 'https://www.youtube.com/embed/UaeOlIa0LL8',
        author_name: 'YouTube',
        image_url: 'https://i.ytimg.com/vi/UaeOlIa0LL8/maxresdefault.jpg',
        og_scrape_url: 'https://www.youtube.com/watch?v=UaeOlIa0LL8',
        text:
          "It's Gmod TTT! Praise Ben in the church of Bon! Hail the great jetstream in Gmod TTT! Confused? Check out the new roles here: https://twitter.com/yogscast/st...",
        thumb_url: 'https://i.ytimg.com/vi/UaeOlIa0LL8/maxresdefault.jpg',
        title: 'THE CHURCH OF BON! | Gmod TTT',
        title_link: 'https://www.youtube.com/watch?v=UaeOlIa0LL8',
        type: 'video',
        mime_type: 'nothing',
      });

      const { getByTestId } = render(getAttachmentComponent({ attachment }));

      await waitFor(() => {
        expect(getByTestId('media-attachment')).toBeInTheDocument();
      });
    });
  });
  it('should render "Card" if attachment type is not recognized, but has title_link or og_scrape_url', async () => {
    const { getByTestId } = render(
      getAttachmentComponent({
        attachment: generateCardAttachment({ type: uuidv4() }),
      }),
    );
    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeInTheDocument();
    });
  });
});

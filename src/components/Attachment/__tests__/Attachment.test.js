import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { nanoid } from 'nanoid';

import {
  generateAttachmentAction,
  generateAudioAttachment,
  generateCardAttachment,
  generateFileAttachment,
  generateGiphyAttachment,
  generateImageAttachment,
  generateImgurAttachment,
  generateVideoAttachment,
} from 'mock-builders';

import { Attachment } from '../Attachment';
import { SUPPORTED_VIDEO_FORMATS } from '../utils';

const Audio = () => <div data-testid='audio-attachment'></div>;
const Card = () => <div data-testid='card-attachment'></div>;
const Media = () => <div data-testid='media-attachment'></div>;
const AttachmentActions = () => <div data-testid='attachment-actions'></div>;
const Image = () => <div data-testid='image-attachment'></div>;
const File = () => <div data-testid='file-attachment'></div>;
const Gallery = () => <div data-testid='gallery-attachment'></div>;

const getAttachmentComponent = (props) => (
  <Attachment
    AttachmentActions={AttachmentActions}
    Audio={Audio}
    Card={Card}
    File={File}
    Gallery={Gallery}
    Image={Image}
    Media={Media}
    {...props}
  />
);

describe('Attachment', () => {
  it('should render Audio component for "audio" type attachment', async () => {
    const attachment = generateAudioAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));
    await waitFor(() => {
      expect(getByTestId('audio-attachment')).toBeInTheDocument();
    });
  });
  it('should render File component for "file" type attachment', async () => {
    const attachment = generateFileAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));
    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeInTheDocument();
    });
  });
  it('should render Card component for "imgur" type attachment', async () => {
    const attachment = generateImgurAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));
    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeInTheDocument();
    });
  });
  it('should render Card component for "giphy" type attachment', async () => {
    const attachment = generateGiphyAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));
    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeInTheDocument();
    });
  });

  describe('gallery  type attachment', () => {
    it('should render Gallery component if attachments contains multiple type "image" attachments', async () => {
      const image = generateImageAttachment({
        og_scrape_url: undefined,
        title_link: undefined,
      });
      const attachments = [image, image, image];
      const { getByTestId } = render(getAttachmentComponent({ attachments }));
      await waitFor(() => {
        expect(getByTestId('gallery-attachment')).toBeInTheDocument();
      });
    });
    it('should render Image and Card if one image has title_link or og_scrape_url', async () => {
      const image = generateImageAttachment({
        og_scrape_url: undefined,
        title_link: undefined,
      });
      const card = generateImageAttachment();
      const attachments = [card, image];
      const { getByTestId } = render(getAttachmentComponent({ attachments }));
      await waitFor(() => {
        expect(getByTestId('image-attachment')).toBeInTheDocument();
        expect(getByTestId('card-attachment')).toBeInTheDocument();
      });
    });

    it('should render Gallery and Card if threres multiple images without and image with title_link or og_scrape_url', async () => {
      const image = generateImageAttachment({
        og_scrape_url: undefined,
        title_link: undefined,
      });
      const card = generateImageAttachment();
      const attachments = [image, image, card];
      const { getByTestId } = render(getAttachmentComponent({ attachments }));
      await waitFor(() => {
        expect(getByTestId('gallery-attachment')).toBeInTheDocument();
        expect(getByTestId('card-attachment')).toBeInTheDocument();
      });
    });
  });
  describe('image type attachment', () => {
    it('should render Card component if attachment has title_link or og_scrape_url', async () => {
      const attachment = generateImageAttachment();
      const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));
      await waitFor(() => {
        expect(getByTestId('card-attachment')).toBeInTheDocument();
      });
    });
    it('should otherwise render Image component', async () => {
      const attachment = generateImageAttachment({
        og_scrape_url: undefined,
        title_link: undefined,
      });
      const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));
      await waitFor(() => {
        expect(getByTestId('image-attachment')).toBeInTheDocument();
      });
    });
    it('should render AttachmentActions component if attachment has actions', async () => {
      const attachment = generateImageAttachment({
        actions: [generateAttachmentAction(), generateAttachmentAction()],
      });
      const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));
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
        const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));
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
        mime_type: 'nothing',
        og_scrape_url: 'https://www.youtube.com/watch?v=UaeOlIa0LL8',
        text:
          "It's Gmod TTT! Praise Ben in the church of Bon! Hail the great jetstream in Gmod TTT! Confused? Check out the new roles here: https://twitter.com/yogscast/st...",
        thumb_url: 'https://i.ytimg.com/vi/UaeOlIa0LL8/maxresdefault.jpg',
        title: 'THE CHURCH OF BON! | Gmod TTT',
        title_link: 'https://www.youtube.com/watch?v=UaeOlIa0LL8',
        type: 'video',
      });

      const { getByTestId } = render(getAttachmentComponent({ attachments: [attachment] }));

      await waitFor(() => {
        expect(getByTestId('media-attachment')).toBeInTheDocument();
      });
    });
  });
  it('should render "Card" if attachment type is not recognized, but has title_link or og_scrape_url', async () => {
    const { getByTestId } = render(
      getAttachmentComponent({
        attachments: [generateCardAttachment({ type: nanoid() })],
      }),
    );
    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeInTheDocument();
    });
  });
});

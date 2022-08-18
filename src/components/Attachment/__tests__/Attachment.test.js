import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { nanoid } from 'nanoid';

import {
  generateAttachmentAction,
  generateAudioAttachment,
  generateFileAttachment,
  generateGiphyAttachment,
  generateImageAttachment,
  generateScrapedAudioAttachment,
  generateScrapedDataAttachment,
  generateScrapedImageAttachment,
  generateVideoAttachment,
} from 'mock-builders';

import { Attachment } from '../Attachment';
import { SUPPORTED_VIDEO_FORMATS } from '../utils';
import { generateScrapedVideoAttachment } from '../../../mock-builders';

const Audio = (props) => <div data-testid='audio-attachment'>{props.customTestId}</div>;
const Card = (props) => <div data-testid='card-attachment'>{props.customTestId}</div>;
const Media = (props) => <div data-testid='media-attachment'>{props.customTestId}</div>;
const AttachmentActions = () => <div data-testid='attachment-actions'></div>;
const Image = (props) => <div data-testid='image-attachment'>{props.customTestId}</div>;
const File = (props) => <div data-testid='file-attachment'>{props.customTestId}</div>;
const Gallery = (props) => <div data-testid='gallery-attachment'>{props.customTestId}</div>;

const ATTACHMENTS = {
  scraped: {
    audio: generateScrapedAudioAttachment(),
    giphy: generateGiphyAttachment(),
    image: generateScrapedImageAttachment(),
    unrecognized: generateScrapedDataAttachment({ type: nanoid() }),
    video: generateScrapedVideoAttachment(),
  },
  uploaded: {
    audio: generateAudioAttachment(),
    file: generateFileAttachment(),
    gallery: Array.from({ length: 3 }, generateImageAttachment),
    image: generateImageAttachment(),
    video: generateVideoAttachment(),
  },
};

const renderComponent = (props) =>
  render(
    <Attachment
      AttachmentActions={AttachmentActions}
      Audio={Audio}
      Card={Card}
      File={File}
      Gallery={Gallery}
      Image={Image}
      Media={Media}
      {...props}
    />,
  );

describe('attachment', () => {
  describe('non-scraped content', () => {
    it('should render empty attachment list if unrecognized type', () => {
      const { container } = renderComponent({ attachments: [{}] });
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    const cases = {
      audio: {
        attachments: [ATTACHMENTS.uploaded.audio],
        case: '"audio" type attachment',
        renderedComponent: 'Audio',
        testId: 'audio-attachment',
      },
      file: {
        attachments: [ATTACHMENTS.uploaded.file],
        case: '"file" type attachment',
        renderedComponent: 'File',
        testId: 'file-attachment',
      },
      gallery: {
        attachments: ATTACHMENTS.uploaded.gallery,
        case: 'message with multiple "image" attachments',
        renderedComponent: 'Gallery',
        testId: 'gallery-attachment',
      },
      image: {
        attachments: [ATTACHMENTS.uploaded.image],
        case: 'message with single image',
        renderedComponent: 'Image',
        testId: 'image-attachment',
      },
    };
    it.each`
      attachments                  | case                  | renderedComponent                  | testId
      ${cases.audio.attachments}   | ${cases.audio.case}   | ${cases.audio.renderedComponent}   | ${cases.audio.testId}
      ${cases.file.attachments}    | ${cases.file.case}    | ${cases.file.renderedComponent}    | ${cases.file.testId}
      ${cases.gallery.attachments} | ${cases.gallery.case} | ${cases.gallery.renderedComponent} | ${cases.gallery.testId}
      ${cases.image.attachments}   | ${cases.image.case}   | ${cases.image.renderedComponent}   | ${cases.image.testId}
    `('should  render $renderedComponent component for $case', async ({ attachments, testId }) => {
      renderComponent({ attachments });
      await waitFor(() => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });
    });

    it.each(SUPPORTED_VIDEO_FORMATS.map((f) => [f]))(
      'should render Media component for video of %s mime-type attachment',
      async (mime_type) => {
        const attachment = generateVideoAttachment({ mime_type });
        renderComponent({ attachments: [attachment] });
        await waitFor(() => {
          expect(screen.getByTestId('media-attachment')).toBeInTheDocument();
        });
      },
    );
  });

  describe('scraped content', () => {
    it('should render null, if og_scrape_url & title_link are undefined', () => {
      const attachment = generateScrapedDataAttachment({
        og_scrape_url: undefined,
        title_link: undefined,
      });
      const { container } = renderComponent({ attachments: [attachment] });
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    const cases = [
      {
        attachments: [ATTACHMENTS.scraped.unrecognized],
        case: 'not recognized, but has title_link or og_scrape_url',
      },
      {
        attachments: [ATTACHMENTS.scraped.giphy],
        case: 'giphy',
      },
      {
        attachments: [ATTACHMENTS.scraped.image],
        case: 'image',
      },
      {
        attachments: [ATTACHMENTS.scraped.video],
        case: 'video',
      },
      {
        attachments: [ATTACHMENTS.scraped.audio],
        case: 'audio',
      },
    ];
    it.each`
      attachments             | case
      ${cases[0].attachments} | ${cases[0].case}
      ${cases[1].attachments} | ${cases[1].case}
      ${cases[2].attachments} | ${cases[2].case}
      ${cases[3].attachments} | ${cases[3].case}
      ${cases[4].attachments} | ${cases[4].case}
    `('should render Card if attachment type is $case', async ({ attachments }) => {
      renderComponent({ attachments });
      await waitFor(() => {
        expect(screen.getByTestId('card-attachment')).toBeInTheDocument();
      });
    });
  });

  describe('combines scraped & uploaded content', () => {
    it('should render Image and Card if one image has title_link or og_scrape_url', async () => {
      const image = generateImageAttachment();
      const card = generateScrapedImageAttachment();
      const attachments = [card, image];
      renderComponent({ attachments });
      await waitFor(() => {
        expect(screen.getByTestId('image-attachment')).toBeInTheDocument();
        expect(screen.getByTestId('card-attachment')).toBeInTheDocument();
      });
    });

    it('should render attachments in default order', async () => {
      const { container } = renderComponent({
        attachments: [
          ATTACHMENTS.uploaded.file,
          ATTACHMENTS.uploaded.audio,
          ATTACHMENTS.uploaded.video,
          ATTACHMENTS.scraped.audio,
          ATTACHMENTS.uploaded.image,
          ATTACHMENTS.uploaded.image,
        ],
      });
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });

    it('should render all scraped attachments', async () => {
      const scrapedAudio = { ...ATTACHMENTS.scraped.audio, customTestId: nanoid() };
      const scrapedVideo = { ...ATTACHMENTS.scraped.video, customTestId: nanoid() };
      const scrapedImage = { ...ATTACHMENTS.scraped.image, customTestId: nanoid() };
      const { queryAllByTestId } = renderComponent({
        attachments: [
          ATTACHMENTS.uploaded.file,
          ATTACHMENTS.uploaded.audio,
          ATTACHMENTS.uploaded.video,
          scrapedAudio,
          scrapedVideo,
          scrapedImage,
          ATTACHMENTS.uploaded.image,
          ATTACHMENTS.uploaded.image,
        ],
      });
      await waitFor(() => {
        /* eslint-disable jest-dom/prefer-in-document */
        const Card = queryAllByTestId('card-attachment');

        expect(Card).toHaveLength(3);

        const idList = Array.from(Card).map((v) => v.textContent);
        expect(idList).toContain(scrapedAudio.customTestId);
        expect(idList).toContain(scrapedVideo.customTestId);
        expect(idList).toContain(scrapedImage.customTestId);
      });
    });

    it('should render all uploaded attachments', async () => {
      const { container } = renderComponent({
        attachments: [
          ATTACHMENTS.uploaded.file,
          ATTACHMENTS.uploaded.file,
          ATTACHMENTS.uploaded.audio,
          ATTACHMENTS.uploaded.audio,
          ATTACHMENTS.uploaded.video,
          ATTACHMENTS.uploaded.video,
          ATTACHMENTS.uploaded.image,
          ATTACHMENTS.uploaded.image,
        ],
      });
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });
  });

  it('should render AttachmentActions component if attachment has actions', async () => {
    const action = generateAttachmentAction();
    const attachment = generateImageAttachment({
      actions: [action, action],
    });
    renderComponent({ attachments: [attachment] });
    await waitFor(() => {
      expect(screen.getByTestId('attachment-actions')).toBeInTheDocument();
    });
  });
});

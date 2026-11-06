import type { LocalVideoAttachment } from 'stream-chat';

import { toBaseImageDescriptors } from '../toBaseImageDescriptors';
import { generateGiphyAttachment } from '../../../mock-builders';

const ORIGINAL_URL =
  'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/giphy.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=giphy.gif&ct=g';
const THUMB_URL = 'http://www.jackblack.com/tenac_iousd.bmp';

describe('toBaseImageDescriptors', () => {
  describe('Giphy attachment', () => {
    it('loads the image from the selected Giphy version', () => {
      const descriptor = toBaseImageDescriptors(generateGiphyAttachment(), {
        giphyVersionName: 'original',
      });

      expect(descriptor?.imageUrl).toBe(ORIGINAL_URL);
      expect(descriptor?.dimensions).toEqual({ height: '400', width: '400' });
    });

    it('falls back to thumb_url when the version is missing', () => {
      const attachment = generateGiphyAttachment();
      const descriptor = toBaseImageDescriptors(
        { ...attachment, giphy: { fixed_height: attachment.giphy!.fixed_height } },
        { giphyVersionName: 'original' },
      );

      expect(descriptor?.imageUrl).toBe(THUMB_URL);
      expect(descriptor?.dimensions).toBeUndefined();
    });

    it('falls back to thumb_url without a version name', () => {
      expect(toBaseImageDescriptors(generateGiphyAttachment())?.imageUrl).toBe(THUMB_URL);
    });

    it('uses a non-URL title as alt', () => {
      const descriptor = toBaseImageDescriptors(
        generateGiphyAttachment({ title: 'dancing cat' }),
        { giphyVersionName: 'original' },
      );

      expect(descriptor?.alt).toBe('dancing cat');
    });

    it('never uses a URL as alt', () => {
      const withUrlTitle = toBaseImageDescriptors(
        generateGiphyAttachment({ title: 'https://giphy.com/gifs/abc' }),
        { giphyVersionName: 'original' },
      );
      const withoutTitle = toBaseImageDescriptors(
        generateGiphyAttachment({ title: undefined }),
        { giphyVersionName: 'original' },
      );

      expect(withUrlTitle?.alt).toBeUndefined();
      expect(withoutTitle?.alt).toBeUndefined();
    });
  });

  describe('Local video attachment', () => {
    const makeLocalVideo = (overrides: Partial<LocalVideoAttachment> = {}) =>
      ({
        localMetadata: {
          file: new File([''], 'clip.mp4', { type: 'video/mp4' }),
          id: 'video-1',
          previewUri: 'blob:http://localhost/clip',
          uploadState: 'pending',
        },
        mime_type: 'video/mp4',
        title: 'clip.mp4',
        type: 'video',
        ...overrides,
      }) as LocalVideoAttachment;

    it('does not use the video blob URL as the thumbnail', () => {
      const descriptor = toBaseImageDescriptors(makeLocalVideo());

      expect(descriptor?.videoThumbnailUrl).toBeUndefined();
      expect(descriptor?.videoUrl).toBe('blob:http://localhost/clip');
    });

    it('uses thumb_url as the thumbnail when present', () => {
      const descriptor = toBaseImageDescriptors(
        makeLocalVideo({
          asset_url: 'https://cdn.example.com/clip.mp4',
          thumb_url: 'https://cdn.example.com/clip.jpg',
        }),
      );

      expect(descriptor?.videoThumbnailUrl).toBe('https://cdn.example.com/clip.jpg');
      expect(descriptor?.videoUrl).toBe('https://cdn.example.com/clip.mp4');
    });
  });
});

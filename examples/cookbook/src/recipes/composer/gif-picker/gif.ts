import type { GiphyVersions, ImageData, Images, LocalAttachment } from 'stream-chat';

/** One GIF the picker offers: its id, a title for screen readers, and its renditions. */
export type Gif = {
  id: string;
  images: Images;
  title: string;
};

/**
 * The renditions in the shape `attachment.giphy` takes: the seven versions the SDK knows, with
 * every field a string. A missing field becomes an empty string.
 */
export const toImages = (
  versions: Partial<Record<GiphyVersions, Partial<ImageData>>>,
): Images => {
  const imageData = (version: GiphyVersions): ImageData => {
    const {
      frames = '',
      height = '',
      size = '',
      url = '',
      width = '',
    } = versions[version] ?? {};
    return { frames, height, size, url, width };
  };
  return {
    fixed_height: imageData('fixed_height'),
    fixed_height_downsampled: imageData('fixed_height_downsampled'),
    fixed_height_still: imageData('fixed_height_still'),
    fixed_width: imageData('fixed_width'),
    fixed_width_downsampled: imageData('fixed_width_downsampled'),
    fixed_width_still: imageData('fixed_width_still'),
    original: imageData('original'),
  };
};

/**
 * The attachment the composer adds for a GIF. Nothing is uploaded, but the composer sends only
 * attachments whose upload state is `finished`, and the type requires a file, so it gets an empty
 * one. `thumb_url` is the image the message list shows; `attachment.giphy` gives its size.
 */
export const toGiphyAttachment = (gif: Gif): LocalAttachment => ({
  custom: {},
  giphy: gif.images,
  localMetadata: {
    file: new File([], gif.id),
    id: crypto.randomUUID(),
    uploadState: 'finished',
  },
  thumb_url: gif.images.fixed_height.url,
  title: gif.title,
  type: 'giphy',
});

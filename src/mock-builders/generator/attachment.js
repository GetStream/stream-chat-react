import { nanoid } from 'nanoid';

export const generateAttachmentAction = (a) => ({
  name: nanoid(),
  text: nanoid(),
  value: nanoid(),
  ...a,
});

export const generateScrapedDataAttachment = (a) => ({
  og_scrape_url: nanoid(),
  title_link: nanoid(),
  ...a,
});

export const generateVideoAttachment = (a) => ({
  asset_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  file_size: 2930530,
  mime_type: 'video/mp4',
  title: nanoid(),
  type: 'video',
  ...a,
});

export const generateScrapedVideoAttachment = (a) => ({
  ...generateScrapedDataAttachment({
    asset_url: nanoid(),
    author_name: nanoid(),
    image_url: nanoid(),
    text: nanoid(),
    thumb_url: nanoid(),
    title: nanoid(),
    type: 'video',
  }),
  ...a,
});

export const generateImageAttachment = (a) => ({
  fallback: nanoid(),
  image_url: nanoid(),
  type: 'image',
  ...a,
});

export const generateScrapedImageAttachment = (a) => ({
  ...generateScrapedDataAttachment({
    author_name: nanoid(),
    image_url: nanoid(),
    text: nanoid(),
    thumb_url: nanoid(),
    title: nanoid(),
    type: 'image',
  }),
  ...a,
});

export const generateAudioAttachment = (a) => ({
  asset_url: 'http://www.jackblack.com/tribute.mp3',
  file_size: 36132,
  mime_type: 'audio/mpeg',
  title: nanoid(),
  type: 'audio',
  ...a,
});

export const generateScrapedAudioAttachment = (a) => ({
  ...generateScrapedDataAttachment({
    asset_url: 'http://www.jackblack.com/tribute.mp3',
    author_name: nanoid(),
    description: nanoid(),
    image_url: 'http://www.jackblack.com/tenac_iousd.bmp',
    text: nanoid(),
    thumb_url: nanoid(),
    title: nanoid(),
    type: 'audio',
  }),
  ...a,
});

export const generateFileAttachment = (a) => ({
  asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  file_size: 1337,
  mime_type: 'application/pdf',
  title: nanoid(),
  type: 'file',
  ...a,
});

export const generateGiphyAttachment = (a) => ({
  thumb_url: 'http://www.jackblack.com/tenac_iousd.bmp',
  title: nanoid(),
  title_link: nanoid(),
  type: 'giphy',
  ...a,
});

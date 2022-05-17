import { nanoid } from 'nanoid';

export const generateAttachmentAction = (a) => ({
  name: nanoid(),
  text: nanoid(),
  value: nanoid(),
  ...a,
});

export const generateVideoAttachment = (a) => ({
  asset_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  mime_type: 'video/mp4',
  title: nanoid(),
  type: 'media',
  ...a,
});

export const generateImageAttachment = (a) => ({
  image_url: nanoid(),
  text: nanoid(),
  thumb_url: nanoid(),
  title: nanoid(),
  title_link: 'https://getstream.io',
  type: 'image',
  ...a,
});

export const generateAudioAttachment = (a) => ({
  asset_url: 'http://www.jackblack.com/tribute.mp3',
  description: nanoid(),
  image_url: 'http://www.jackblack.com/tenac_iousd.bmp',
  text: nanoid(),
  title: nanoid(),
  type: 'audio',
  ...a,
});

export const generateFileAttachment = (a) => ({
  asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  description: nanoid(),
  file_size: 1337,
  mime_type: nanoid(),
  text: nanoid(),
  title: nanoid(),
  type: 'file',
  ...a,
});

export const generateCardAttachment = (a) => ({
  image_url: 'http://www.jackblack.com/tenac_iousd.bmp',
  og_scrape_url: nanoid(),
  text: nanoid(),
  thumb_url: 'http://www.jackblack.com/tenac_iousd.bmp',
  title: nanoid(),
  title_link: nanoid(),
  ...a,
});

export const generateImgurAttachment = () => generateCardAttachment({ type: 'imgur' });

export const generateGiphyAttachment = () => generateCardAttachment({ type: 'giphy' });

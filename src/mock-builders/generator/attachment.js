/* eslint-disable sonarjs/no-duplicate-string */
import { v4 as uuidv4 } from 'uuid';

export const generateAttachmentAction = (a) => {
  return {
    value: uuidv4(),
    name: uuidv4(),
    text: uuidv4(),
    ...a,
  };
};

export const generateVideoAttachment = (a) => {
  return {
    type: 'media',
    title: uuidv4(),
    mime_type: 'video/mp4',
    asset_url:
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    ...a,
  };
};

export const generateImageAttachment = (a) => {
  return {
    type: 'image',
    title: uuidv4(),
    title_link: 'https://getstream.io',
    text: uuidv4(),
    image_url: uuidv4(),
    thumb_url: uuidv4(),
    ...a,
  };
};

export const generateAudioAttachment = (a) => {
  return {
    type: 'audio',
    title: uuidv4(),
    text: uuidv4(),
    description: uuidv4(),
    asset_url: 'http://www.jackblack.com/tribute.mp3',
    image_url: 'http://www.jackblack.com/tenac_iousd.bmp',
    ...a,
  };
};

export const generateFileAttachment = (a) => {
  return {
    type: 'file',
    mime_type: uuidv4(),
    title: uuidv4(),
    asset_url:
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: 1337,
    text: uuidv4(),
    description: uuidv4(),
    ...a,
  };
};

export const generateCardAttachment = (a) => {
  return {
    title: uuidv4(),
    title_link: uuidv4(),
    og_scrape_url: uuidv4(),
    image_url: 'http://www.jackblack.com/tenac_iousd.bmp',
    thumb_url: 'http://www.jackblack.com/tenac_iousd.bmp',
    text: uuidv4(),
    ...a,
  };
};

export const generateImgurAttachment = () => {
  return generateCardAttachment({ type: 'imgur' });
};

export const generateGiphyAttachment = () => {
  return generateCardAttachment({ type: 'giphy' });
};

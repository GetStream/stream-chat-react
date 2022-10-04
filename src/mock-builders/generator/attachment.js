import { nanoid } from 'nanoid';

export const generateAttachmentAction = (a) => ({
  name: nanoid(),
  text: nanoid(),
  value: nanoid(),
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

export const generateImageAttachment = (a) => ({
  fallback: nanoid(),
  image_url: 'http://' + nanoid(),
  type: 'image',
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

export const generateAudioAttachment = (a) => ({
  asset_url: 'http://www.jackblack.com/tribute.mp3',
  file_size: 36132,
  mime_type: 'audio/mpeg',
  title: nanoid(),
  type: 'audio',
  ...a,
});

export const generateScrapedDataAttachment = (a) => ({
  og_scrape_url: nanoid(),
  title_link: nanoid(),
  ...a,
});

export const generateScrapedImageAttachment = (a) => ({
  ...generateScrapedDataAttachment({
    author_name: nanoid(),
    image_url: 'http://' + nanoid(),
    text: nanoid(),
    thumb_url: 'http://' + nanoid(),
    title: nanoid(),
    type: 'image',
  }),
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

export const generateGiphyAttachment = (a) => ({
  giphy: {
    fixed_height: {
      frames: '',
      height: '200',
      size: '445149',
      url:
        'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200.gif&ct=g',
      width: '200',
    },
    fixed_height_downsampled: {
      frames: '',
      height: '200',
      size: '148168',
      url:
        'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200_d.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200_d.gif&ct=g',
      width: '200',
    },
    fixed_height_still: {
      frames: '',
      height: '200',
      size: '23240',
      url:
        'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200_s.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200_s.gif&ct=g',
      width: '200',
    },
    fixed_width: {
      frames: '',
      height: '200',
      size: '445149',
      url:
        'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200w.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200w.gif&ct=g',
      width: '200',
    },
    fixed_width_downsampled: {
      frames: '',
      height: '200',
      size: '148168',
      url:
        'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200w_d.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200w_d.gif&ct=g',
      width: '200',
    },
    fixed_width_still: {
      frames: '',
      height: '200',
      size: '23240',
      url:
        'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200w_s.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200w_s.gif&ct=g',
      width: '200',
    },
    original: {
      frames: '20',
      height: '400',
      size: '1308571',
      url:
        'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/giphy.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=giphy.gif&ct=g',
      width: '400',
    },
  },
  thumb_url: 'http://www.jackblack.com/tenac_iousd.bmp',
  title: nanoid(),
  title_link: nanoid(),
  type: 'giphy',
  ...a,
});

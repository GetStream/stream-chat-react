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

export const generateAudioRecordingAttachment = (a) => ({
  asset_url:
    'https://us-east.stream-io-cdn.com/63735/attachments/a5f87c12-4f5c-43f3-a414-843769f11846.audio3674320446385852952.m4a',
  duration: 3344,
  file_size: 55381,
  mime_type: 'audio/mp4',
  title: 'audio3674320446385852952.m4a',
  type: 'audio_recording',
  waveList: [
    0.37380469902441266,
    0.41826093557585853,
    0.2540483935167756,
    0.06147674798244081,
    0.0971939236548669,
    0.07670167432738663,
    0,
    0.11216573111553133,
    0.05168677578361813,
    0.04331938360970158,
    0.08706355459378165,
    0.5716461684863291,
    0.34862184139303154,
    0.1811392534884785,
    0.06919840477266977,
    0.646164320630517,
    0.971743828110727,
    0.9767385224406302,
    0.8275598256111429,
    0.8171199511806752,
    0.874600009310294,
    1,
    0.9953821660267507,
    0.9466082423914262,
    0.7914406311946874,
    0.5298793324365345,
    0.23434318567652615,
    0.15670769040501656,
    0.11881985646698717,
    0.12067968386243798,
  ],
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

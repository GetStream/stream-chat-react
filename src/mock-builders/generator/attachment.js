import { nanoid } from 'nanoid';

export const generateAttachmentAction = (a) => ({
  name: nanoid(),
  text: nanoid(),
  value: nanoid(),
  ...a,
});

export const generateFile = (overrides) => ({
  lastModified: 12345,
  lastModifiedDate: new Date(12345),
  name: 'file.pdf',
  size: 144,
  type: 'application/pdf',
  webkitRelativePath: '',
  ...overrides,
});

export const generateImageFile = (overrides) => ({
  ...generateFile(),
  name: 'image.png',
  type: 'image/png',
  ...overrides,
});

export const generateLocalAttachmentData = () => ({
  localMetadata: {
    id: nanoid(),
  },
});

export const generateLocalFileUploadAttachmentData = (overrides, attachmentData) => ({
  localMetadata: {
    ...generateLocalAttachmentData().localMetadata,
    ...overrides,
    file: generateFile(overrides?.file ?? {}),
  },
  type: 'file',
  ...attachmentData,
});

export const generateLocalImageUploadAttachmentData = (overrides, attachmentData) => ({
  localMetadata: {
    ...generateLocalFileUploadAttachmentData().localMetadata,
    previewUri: 'image-preview-uri',
    ...overrides,

    file: generateImageFile(overrides?.file ?? {}),
  },
  type: 'image',
  ...attachmentData,
});

export const generateFileAttachment = (a) => ({
  asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  file_size: 1337,
  mime_type: 'application/pdf',
  title: nanoid() + '.pdf',
  type: 'file',
  ...a,
});

export const generateImageAttachment = (a) => ({
  fallback: nanoid() + '.png',
  image_url: 'http://' + nanoid(),
  type: 'image',
  ...a,
});

export const generateVideoAttachment = (a) => ({
  asset_url:
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  file_size: 2930530,
  mime_type: 'video/mp4',
  thumb_url: 'thumb_url',
  title: nanoid() + '.mp4',
  type: 'video',
  ...a,
});

export const generateAudioAttachment = (a) => ({
  asset_url: 'http://www.jackblack.com/tribute.mp3',
  file_size: 36132,
  mime_type: 'audio/mpeg',
  title: nanoid() + '.mpeg',
  type: 'audio',
  ...a,
});

export const generateVoiceRecordingAttachment = (a) => ({
  asset_url:
    'https://us-east.stream-io-cdn.com/102398/attachments/874e23e5-0746-4af7-a16e-d522a657d9e3.audio_recording_Mon_Feb_05_16_21_34_PST_2024?Expires=1708388555&Signature=DS4G5nHBTV5CgOEOKEBfnqQ-ThAYWhavSejBYXXKxXPzyYeB5siKq5CHCfLj7K8RSU2ISYRjUNBpvVbVpCTohsS5hxbss0ccdZrDGli1w5mchMU7J5CVuW~EXJs0Kzchoa0D4xBwnelX6SSC5hLJ8zLa-hDVfGylvbwk9wbV2iZps0OC~NxrySPafi8tY~rVM0RKwyv9AJyFtXreASWmuVY3uI7GXdVY3YWHmxKGQ5HA7ctGJ1nbQYWC07B-mgWKavjvhpIgRP0st1hVKQO6AwPA9hKhaQUnDkwIeYs~8FtmRBUKUxGCGcagJjTVRkj3nyHoPI-3HMvINYjxvBRLGQ__&Key-Pair-Id=APKAIHG36VEWPDULE23Q',
  duration: 43.007999420166016,
  file_size: 67940,
  mime_type: 'audio/aac',
  title: 'audio_recording_Mon Feb 05 16:21:34 PST 2024.aac',
  type: 'voiceRecording',
  waveform_data: [
    0.3139950633049011, 0.24018539488315582, 0.27728691697120667, 0.2946733236312866,
    0.18365363776683807, 0.4870237708091736, 0.5902017951011658, 0.43630164861679077,
    0.4746025502681732, 0.2663217782974243, 0.7870231866836548, 0.6237155795097351,
    0.36374375224113464, 0.2663217782974243, 0.6613287329673767, 0.8278987407684326,
    0.1516059935092926, 0.37934044003486633, 0.5281689167022705, 0.47579875588417053,
    0.48600485920906067, 0.6229274868965149, 0.4964161813259125, 0.4377916753292084,
    0.5569855570793152, 0.5540405511856079, 0.4095909595489502, 0.747698187828064,
    0.8532787561416626, 0.6344320178031921, 0.5756412744522095, 0.529367208480835,
    0.8330334424972534, 0.8681668043136597, 0.6670080423355103, 0.7732296586036682,
    0.7542996406555176, 0.6666833758354187, 0.4648399353027344, 0.4689463675022125,
    0.515621542930603, 0.7782987952232361, 0.6618493795394897, 0.6291788220405579,
    0.7447969317436218, 0.7329777479171753, 0.7156173586845398, 0.8810608386993408,
    0.07107513397932053, 0.07438423484563828, 0.08600494265556335, 0.1429901123046875,
    0.059566497802734375, 0.032375335693359375, 0.14445610344409943, 0.9534039497375488,
    0.8612125515937805, 0.4861070513725281, 0.5025619864463806, 0.3678266108036041,
    0.5829864144325256, 0.6209651231765747, 0.6576777696609497, 0.6046710014343262,
    0.08803673088550568, 0.492523193359375, 0.1947961449623108, 0.09975242614746094,
    0.03940269351005554, 0.372602641582489, 0.4425804913043976, 0.6269233226776123,
    0.7768490314483643, 0.41689178347587585, 0.18697471916675568, 0.11767738312482834,
    0.049776915460824966, 0.1377594769001007, 0.08291183412075043, 0.05717025697231293,
    0.01960846036672592, 0.04073379561305046, 0.2909153699874878, 0.2615521252155304,
    0.1473514586687088, 0.8678494095802307, 0.9467474222183228, 0.7687522768974304,
    0.8469597101211548, 0.6312726736068726, 0.5455475449562073, 0.8171653747558594,
    0.7835009694099426, 0.6183612942695618, 0.7298175692558289, 0.6681936383247375,
    0.815593957901001, 0.7774609327316284, 0.8033567070960999, 0.8980446457862854,
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
      url: 'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200.gif&ct=g',
      width: '200',
    },
    fixed_height_downsampled: {
      frames: '',
      height: '200',
      size: '148168',
      url: 'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200_d.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200_d.gif&ct=g',
      width: '200',
    },
    fixed_height_still: {
      frames: '',
      height: '200',
      size: '23240',
      url: 'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200_s.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200_s.gif&ct=g',
      width: '200',
    },
    fixed_width: {
      frames: '',
      height: '200',
      size: '445149',
      url: 'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200w.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200w.gif&ct=g',
      width: '200',
    },
    fixed_width_downsampled: {
      frames: '',
      height: '200',
      size: '148168',
      url: 'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200w_d.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200w_d.gif&ct=g',
      width: '200',
    },
    fixed_width_still: {
      frames: '',
      height: '200',
      size: '23240',
      url: 'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/200w_s.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=200w_s.gif&ct=g',
      width: '200',
    },
    original: {
      frames: '20',
      height: '400',
      size: '1308571',
      url: 'https://media2.giphy.com/media/j5L4RHeV8Q5tmepRVb/giphy.gif?cid=c4b03675kgziudvt7s9990i28hp8zpffi4oyem1snvl7sfvl&rid=giphy.gif&ct=g',
      width: '400',
    },
  },
  thumb_url: 'http://www.jackblack.com/tenac_iousd.bmp',
  title: nanoid(),
  title_link: nanoid(),
  type: 'giphy',
  ...a,
});

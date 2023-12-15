import { nanoid } from 'nanoid';
import { UploadState } from '../../components';
import {
  generateFileAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from './attachment';

const generateFileData = (fileOverrides) => {
  const date = new Date();
  return {
    lastModified: +date,
    lastModifiedDate: date,
    name: nanoid(),
    size: 10,
    type: 'file',
    uri: null,
    ...fileOverrides,
  };
};

export const generateMessageComposerFileAttachment = ({
  fileOverrides = {},
  objectOverrides = {},
} = {}) => ({
  ...generateFileAttachment(),
  file: {
    ...generateFileData(),
    type: 'file',
    ...fileOverrides,
  },
  id: nanoid(),
  uploadState: UploadState.finished,
  ...objectOverrides,
});

export const generateMessageComposerVideoAttachment = ({
  fileOverrides = {},
  objectOverrides = {},
} = {}) => ({
  ...generateVideoAttachment(),
  file: {
    ...generateFileData(),
    type: 'video',
    ...fileOverrides,
  },
  id: nanoid(),
  uploadState: UploadState.finished,
  ...objectOverrides,
});

export const generateMessageComposerImageAttachment = ({
  fileOverrides = {},
  objectOverrides = {},
} = {}) => ({
  ...generateImageAttachment(),
  file: {
    ...generateFileData(),
    type: 'image',
    ...fileOverrides,
  },
  id: nanoid(),
  uploadState: UploadState.finished,
  ...objectOverrides,
});
